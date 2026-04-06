// BookPawty.jsx - WITH OWN CONFIRMATION PAGE INSIDE THE COMPONENT
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, ProgressBar, Form, Modal, Alert } from 'react-bootstrap';
import { useAuth } from '../backend/context/AuthContext';
import { supabase } from '../backend/supabaseClient';
import { createProfileBooking } from '../backend/services/profileDataService';
import gcashQr from '../assets/gcashqr.jpg';
import './BookPawty.css';

const MAX_PET_PHOTO_SIZE = 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const normalizePetType = (value) => {
  const text = String(value || '').toLowerCase();
  if (text.includes('cat')) return 'Cat';
  return 'Dog';
};

const coreSizeToPawtySize = (value) => {
  const text = String(value || '').trim();
  if (text === 'Small') return 'Small (1-5 kg)';
  if (text === 'Medium') return 'Medium (6-10 kg)';
  if (text === 'Large') return 'Large (11-20 kg)';
  if (text === 'XL' || text === 'ExtraLarge') return 'Extra Large (21+ kg)';
  return 'Medium (6-10 kg)';
};

const pawtySizeToCoreSize = (value) => {
  const text = String(value || '').toLowerCase();
  if (text.includes('small')) return 'Small';
  if (text.includes('medium')) return 'Medium';
  if (text.includes('large') && !text.includes('extra')) return 'Large';
  if (text.includes('extra') || text.includes('xl') || text.includes('21+')) return 'ExtraLarge';
  return 'Medium';
};

const parsePetNotes = (value) => {
  if (!value || typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (_error) {
    return {};
  }
};

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Unable to read the selected image.'));
    reader.readAsDataURL(file);
  });
}

const BookPawty = () => {
  const navigate = useNavigate();
  const { user: authUser, profile: authProfile } = useAuth();
  const [activeStep, setActiveStep] = useState(1);
  const steps = ['Select Pet', 'Party Details', 'Payment'];
  
  const [pets, setPets] = useState([]);
  const [isLoadingPets, setIsLoadingPets] = useState(true);
  const [petsError, setPetsError] = useState('');

  const [serviceType, setServiceType] = useState('');
  const [partyDate, setPartyDate] = useState('');
  const [partyTime, setPartyTime] = useState('');
  const [guests, setGuests] = useState('1-5');
  const [cakeFlavor, setCakeFlavor] = useState('squash-banana');
  const [pastaChoice, setPastaChoice] = useState('baked-mac');
  const [bannerName, setBannerName] = useState('');
  const [hatColor, setHatColor] = useState('blue');
  const paymentMethod = 'gcash';
  const [specialRequests, setSpecialRequests] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [paymentProof, setPaymentProof] = useState(null);
  const [selectedConsumables, setSelectedConsumables] = useState([]);
  const [consumablesTotal, setConsumablesTotal] = useState(0);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // NEW: State for showing confirmation page
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingPet, setIsSavingPet] = useState(false);
  const [isDeletingPet, setIsDeletingPet] = useState(false);
  const [modalError, setModalError] = useState('');
  
  const [petForm, setPetForm] = useState({
    name: '',
    type: 'Dog',
    size: 'Medium (6-10 kg)',
    breed: '',
    age: '',
    birthday: '',
    photoDataUrl: null,
    photoName: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    parentAddress: ''
  });

  const menuItems = {
    beverages: [
      { id: 1, category: 'ICED COFFEE (16OZ)', name: 'Americano', price: 100 },
      { id: 2, category: 'ICED COFFEE (16OZ)', name: 'Cafe Latte', price: 120 },
      { id: 3, category: 'ICED COFFEE (16OZ)', name: 'Caramel Macchiato', price: 145 },
      { id: 4, category: 'ICED COFFEE (16OZ)', name: 'Iced Matcha Latte', price: 135 },
      { id: 5, category: 'ICED COFFEE (16OZ)', name: 'Spanish Latte', price: 140 },
      { id: 6, category: 'NON-CAFFEINE', name: 'Four Seasons', price: 90 },
      { id: 7, category: 'NON-CAFFEINE', name: 'Hot Chocolate', price: 110 },
      { id: 8, category: 'NON-CAFFEINE', name: 'Iced Choco Milk', price: 120 },
      { id: 9, category: 'NON-CAFFEINE', name: 'Strawberry Milk', price: 130 },
      { id: 10, category: 'NON-CAFFEINE', name: 'Blueberry Soda', price: 150 }
    ],
    food: [
      { id: 11, category: 'RICE MEALS', name: 'Breaded Fish Fillet', price: 140 },
      { id: 12, category: 'RICE MEALS', name: 'Burger Steak', price: 150 },
      { id: 13, category: 'RICE MEALS', name: 'Chicken Cordon Bleu', price: 160 },
      { id: 14, category: 'RICE MEALS', name: 'Chicken Fillet', price: 170 },
      { id: 15, category: 'RICE MEALS', name: 'Hungarian Sausage', price: 180 },
      { id: 16, category: 'SNACKS AND PASTA', name: 'Baked Macaroni', price: 190 },
      { id: 17, category: 'SNACKS AND PASTA', name: 'Chicken Alfredo', price: 190 },
      { id: 18, category: 'SNACKS AND PASTA', name: 'Cheesy Beef Burger', price: 190 },
      { id: 19, category: 'SNACKS AND PASTA', name: 'Chicken Popcorn', price: 150 },
      { id: 20, category: 'SNACKS AND PASTA', name: 'Fish and Fries', price: 200 }
    ]
  };

  const petTypes = ['Dog', 'Cat'];
  const petSizes = [
    { value: 'Small (1-5 kg)', label: 'Small (1-5 kg)' },
    { value: 'Medium (6-10 kg)', label: 'Medium (6-10 kg)' },
    { value: 'Large (11-20 kg)', label: 'Large (11-20 kg)' },
    { value: 'Extra Large (21+ kg)', label: 'Extra Large (21+ kg)' }
  ];

  const cakeFlavors = [
    { value: 'squash-banana', label: 'Squash & Banana' },
    { value: 'carrot-pb', label: 'Carrot with Peanut Butter' }
  ];

  const ownerDefaults = useMemo(() => ({
    parentName: [authProfile?.first_name, authProfile?.last_name].filter(Boolean).join(' ').trim(),
    parentPhone: authProfile?.phone || '',
    parentEmail: authUser?.email || '',
    parentAddress: '',
  }), [authProfile?.first_name, authProfile?.last_name, authProfile?.phone, authUser?.email]);

  const mapRowToPet = (row) => {
    const details = parsePetNotes(row.notes);
    const rowBirthday = row.birth_date ? String(row.birth_date).slice(0, 10) : '';

    return {
      id: row.id,
      name: row.name || 'Pet',
      type: normalizePetType(row.species),
      size: coreSizeToPawtySize(details.size),
      breed: row.breed || 'Unknown breed',
      age: details.age || '',
      birthday: details.birthday || rowBirthday,
      photoDataUrl: details.photoDataUrl || null,
      photoName: details.photoName || '',
      selected: false,
      parentName: details.parentName || ownerDefaults.parentName || '',
      parentPhone: details.parentPhone || ownerDefaults.parentPhone || '',
      parentEmail: details.parentEmail || ownerDefaults.parentEmail || '',
      parentAddress: details.parentAddress || ownerDefaults.parentAddress || '',
    };
  };

  const serializePetNotes = (form) => JSON.stringify({
    size: pawtySizeToCoreSize(form.size),
    age: form.age?.trim() || '',
    birthday: form.birthday || '',
    parentName: form.parentName?.trim() || '',
    parentPhone: form.parentPhone?.trim() || '',
    parentEmail: form.parentEmail?.trim() || '',
    parentAddress: form.parentAddress?.trim() || '',
    photoDataUrl: form.photoDataUrl || null,
    photoName: form.photoName || '',
  });

  useEffect(() => {
    const loadPets = async () => {
      if (!supabase || !authUser?.id) {
        setPets([]);
        setIsLoadingPets(false);
        return;
      }

      setIsLoadingPets(true);
      setPetsError('');

      const { data, error } = await supabase
        .from('pets')
        .select('id, name, species, breed, birth_date, notes, created_at')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: true });

      if (error) {
        setPets([]);
        setPetsError(error.message || 'Could not load pets right now.');
        setIsLoadingPets(false);
        return;
      }

      const loadedPets = Array.isArray(data) ? data.map(mapRowToPet) : [];
      const nextPets = loadedPets.map((pet, index) => ({
        ...pet,
        selected: index === 0,
      }));

      setPets(nextPets);
      setIsLoadingPets(false);
    };

    void loadPets();
  }, [authUser?.id, ownerDefaults]);

  const handleAddPet = () => {
    setIsEditing(false);
    setEditingPet(null);
    setModalError('');
    setPetForm({
      name: '',
      type: 'Dog',
      size: 'Medium (6-10 kg)',
      breed: '',
      age: '',
      birthday: '',
      photoDataUrl: null,
      photoName: '',
      parentName: ownerDefaults.parentName || '',
      parentPhone: ownerDefaults.parentPhone || '',
      parentEmail: ownerDefaults.parentEmail || '',
      parentAddress: ownerDefaults.parentAddress || ''
    });
    setShowModal(true);
  };

  const handleEditPet = (pet) => {
    setIsEditing(true);
    setEditingPet(pet);
    setModalError('');
    setPetForm({ ...pet });
    setShowModal(true);
  };

  const handleSelectPet = (id) => {
    const updatedPets = pets.map(pet => ({
      ...pet,
      selected: pet.id === id
    }));
    setPets(updatedPets);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setPetForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePetPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_PET_PHOTO_SIZE) {
      alert('Pet photo must be 1MB or less.');
      e.target.value = '';
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert('Only JPG, PNG, and WEBP images are allowed for pet photos.');
      e.target.value = '';
      return;
    }

    try {
      const photoDataUrl = await readFileAsDataUrl(file);
      if (selectedPet) {
        setPets((prev) =>
          prev.map((pet) =>
            pet.id === selectedPet.id
              ? {
                  ...pet,
                  photoDataUrl,
                  photoName: file.name,
                }
              : pet
          )
        );
      } else {
        setPetForm((prev) => ({
          ...prev,
          photoDataUrl,
          photoName: file.name,
        }));
      }
    } catch (error) {
      alert(error.message || 'Unable to read the selected image.');
    } finally {
      e.target.value = '';
    }
  };

  const handleRemovePetPhoto = () => {
    if (selectedPet) {
      setPets((prev) =>
        prev.map((pet) =>
          pet.id === selectedPet.id
            ? {
                ...pet,
                photoDataUrl: null,
                photoName: '',
              }
            : pet
        )
      );
      return;
    }

    setPetForm((prev) => ({
      ...prev,
      photoDataUrl: null,
      photoName: '',
    }));
  };

  const handleSavePet = async () => {
    if (!supabase || !authUser?.id) return;
    if (!petForm.name || !petForm.breed || !petForm.age || !petForm.parentName || !petForm.parentPhone || !petForm.parentEmail) {
      return;
    }

    setIsSavingPet(true);
    setModalError('');

    const payload = {
      user_id: authUser.id,
      name: petForm.name.trim(),
      species: normalizePetType(petForm.type).toLowerCase(),
      breed: petForm.breed.trim(),
      birth_date: petForm.birthday || null,
      notes: serializePetNotes(petForm),
      updated_at: new Date().toISOString(),
    };

    if (isEditing && editingPet?.id) {
      const { data, error } = await supabase
        .from('pets')
        .update(payload)
        .eq('id', editingPet.id)
        .eq('user_id', authUser.id)
        .select('id, name, species, breed, birth_date, notes, created_at')
        .single();

      if (error) {
        setModalError(error.message || 'Could not update this pet.');
        setIsSavingPet(false);
        return;
      }

      const updatedPet = mapRowToPet(data);
      setPets((prev) => prev.map((pet) => (
        pet.id === editingPet.id
          ? { ...updatedPet, selected: pet.selected }
          : pet
      )));
      setIsSavingPet(false);
      setShowModal(false);
      return;
    }

    const { data, error } = await supabase
      .from('pets')
      .insert(payload)
      .select('id, name, species, breed, birth_date, notes, created_at')
      .single();

    if (error) {
      setModalError(error.message || 'Could not save this pet.');
      setIsSavingPet(false);
      return;
    }

    const newPet = mapRowToPet(data);
    setPets((prev) => [
      ...prev.map((pet) => ({ ...pet, selected: false })),
      { ...newPet, selected: true },
    ]);
    setIsSavingPet(false);
    setShowModal(false);
  };

  const handleDeletePet = async () => {
    if (!supabase || !authUser?.id || !editingPet?.id) return;

    setIsDeletingPet(true);
    setModalError('');

    const { error } = await supabase
      .from('pets')
      .delete()
      .eq('id', editingPet.id)
      .eq('user_id', authUser.id);

    if (error) {
      setModalError(error.message || 'Could not delete this pet.');
      setIsDeletingPet(false);
      return;
    }

    setPets((prev) => {
      const remaining = prev.filter((pet) => pet.id !== editingPet.id);
      if (remaining.length === 0) return [];
      if (remaining.some((pet) => pet.selected)) return remaining;
      return remaining.map((pet, index) => ({ ...pet, selected: index === 0 }));
    });

    setIsDeletingPet(false);
    setShowModal(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        alert('Only JPG, JPEG, and PNG files are allowed');
        return;
      }
      setPaymentProof(file);
    }
  };

  const handleConsumableSelect = (item) => {
    const existingIndex = selectedConsumables.findIndex(i => i.id === item.id);
    
    if (existingIndex >= 0) {
      const updatedSelection = selectedConsumables.filter(i => i.id !== item.id);
      setSelectedConsumables(updatedSelection);
      setConsumablesTotal(consumablesTotal - (item.price * selectedConsumables[existingIndex].quantity));
    } else {
      const newTotal = consumablesTotal + item.price;
      
      if (newTotal > 800) {
        alert(`Cannot add ${item.name}. Would exceed ₱800 limit. Current total: ₱${consumablesTotal}`);
        return;
      }
      
      setSelectedConsumables([...selectedConsumables, { ...item, quantity: 1 }]);
      setConsumablesTotal(newTotal);
    }
  };

  const updateConsumableQuantity = (e, id, newQuantity) => {
    e.preventDefault();
    e.stopPropagation();
    
    const itemIndex = selectedConsumables.findIndex(i => i.id === id);
    if (itemIndex === -1) return;

    const updatedConsumables = [...selectedConsumables];
    const oldItem = updatedConsumables[itemIndex];
    const oldTotal = oldItem.price * oldItem.quantity;
    
    if (newQuantity < 1) {
      const filteredConsumables = selectedConsumables.filter(i => i.id !== id);
      setSelectedConsumables(filteredConsumables);
      setConsumablesTotal(consumablesTotal - oldTotal);
      return;
    }

    const newItemTotal = oldItem.price * newQuantity;
    const newOverallTotal = consumablesTotal - oldTotal + newItemTotal;

    if (newOverallTotal > 800) {
      alert(`Cannot increase quantity. Would exceed ₱800 limit. Current total: ₱${consumablesTotal}`);
      return;
    }

    updatedConsumables[itemIndex] = { ...oldItem, quantity: newQuantity };
    setSelectedConsumables(updatedConsumables);
    setConsumablesTotal(newOverallTotal);
  };

  const removeConsumable = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    
    const item = selectedConsumables.find(i => i.id === id);
    if (item) {
      const updatedSelection = selectedConsumables.filter(i => i.id !== id);
      setSelectedConsumables(updatedSelection);
      setConsumablesTotal(consumablesTotal - (item.price * item.quantity));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (activeStep === 1) {
      const selectedPets = pets.filter(pet => pet.selected);
      if (selectedPets.length === 0) newErrors.pet = 'Please select a pet';
    }

    if (activeStep === 2) {
      if (!bannerName.trim()) newErrors.bannerName = 'Banner name is required';
      if (!partyDate) newErrors.partyDate = 'Party date is required';
      if (!partyTime) newErrors.partyTime = 'Party time is required';
      if (!acceptedTerms) newErrors.terms = 'You must agree to the terms and conditions';
      if (consumablesTotal < 100) newErrors.consumables = 'Please select at least ₱100 worth of consumables';
      if (consumablesTotal > 800) newErrors.consumables = 'Consumables selection exceeds ₱800 limit';

      const selectedDate = new Date(partyDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (partyDate && selectedDate < today) {
        newErrors.partyDate = 'Date cannot be in the past';
      }
    }

    if (activeStep === 3) {
      if (!paymentProof) {
        newErrors.paymentProof = 'Please upload proof of payment for GCash';
      }
    }

    return newErrors;
  };

  const handleStepClick = (stepNumber) => {
    if (stepNumber < activeStep) {
      setActiveStep(stepNumber);
    }
  };

  const handleContinue = () => {
    const selectedPets = pets.filter(pet => pet.selected);
    if (selectedPets.length === 0) {
      alert('Please select a pet for the pawty');
      return;
    }
    setActiveStep(2);
  };

  const handleContinueToPayment = () => {
    const formErrors = validateForm();
    if (Object.keys(formErrors).length === 0) {
      setActiveStep(3);
    } else {
      setErrors(formErrors);
    }
  };

  // Submit and persist booking so profile can reflect this reservation.
  const handleSubmit = async () => {
    if (!authUser?.id) {
      alert('Please log in first to complete this booking.');
      return;
    }

    const selectedPet = pets.find((pet) => pet.selected);
    if (!selectedPet) {
      alert('Please select a pet for the pawty.');
      return;
    }

    setIsSubmitting(true);

    try {
      let paymentProofDataUrl = null;
      let paymentProofName = '';
      if (paymentProof) {
        paymentProofDataUrl = await readFileAsDataUrl(paymentProof);
        paymentProofName = paymentProof.name || '';
      }

      await createProfileBooking(authUser.id, {
        service: 'Birthday Pawty Package',
        serviceType: 'bdaypawty',
        customerName: selectedPet?.parentName || null,
        customerEmail: selectedPet?.parentEmail || authUser?.email || '',
        customerPhone: selectedPet?.parentPhone || null,
        petName: selectedPet.name || null,
        petBreed: selectedPet.breed || null,
        petType: selectedPet.type || null,
        petBirthday: selectedPet.birthday || null,
        date: partyDate,
        time: partyTime,
        status: 'Processing',
        priceLabel: 'PHP 2,000.00',
        paymentMethod,
        paymentStatus: 'Pending',
        note: `Guests: ${guests}; Banner: ${bannerName || 'N/A'}`,
        metadata: {
          guests,
          cakeFlavor,
          pastaChoice,
          bannerName,
          hatColor,
          paymentMethod,
          consumablesTotal,
          selectedConsumables,
          specialRequests,
          petBirthday: selectedPet.birthday || null,
          petSize: selectedPet.size || null,
          petPhotoDataUrl: selectedPet.photoDataUrl || null,
          petPhotoName: selectedPet.photoName || null,
          paymentProofDataUrl,
          paymentProofName,
        },
      });

      setShowConfirmation(true);
      setActiveStep(4);
    } catch (error) {
      alert(error?.message || 'Unable to save booking right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleBack = () => {
    setModalError('');
    setShowModal(false);
  };

  const getProgressPercentage = () => {
    if (showConfirmation) return 100;
    switch(activeStep) {
      case 1: return 33;
      case 2: return 66;
      case 3: return 100;
      default: return 33;
    }
  };

  const getPetTypeClass = (type) => {
    return type === 'Dog' ? 'ht-pawty-pet-dog' : 'ht-pawty-pet-cat';
  };

  const selectedPet = pets.find(pet => pet.selected);

  return (
    <div className="ht-pawty-book">
      <Container className="ht-pawty-container">
        <Row className="ht-pawty-title-row">
          <Col>
            <h1 className="ht-pawty-main-title">Book Your Pet's Pawty</h1>
            <p className="ht-pawty-subtitle">
              Let's make your pet's birthday unforgettable! Follow the steps below to book your pawty.
            </p>
          </Col>
        </Row>

        <Row className="ht-pawty-progress-row">
          <Col>
            <div className="ht-pawty-progress-steps">
              <ProgressBar now={getProgressPercentage()} className="ht-pawty-progress-bar" />
              <div className="ht-pawty-step-indicators">
                {steps.map((step, index) => {
                  const stepNumber = index + 1;
                  const isClickable = stepNumber < activeStep && !showConfirmation;
                  
                  return (
                    <div 
                      key={index} 
                      className={`ht-pawty-step ${stepNumber === activeStep ? 'ht-pawty-step-active' : ''} ${isClickable ? 'ht-pawty-step-clickable' : ''}`}
                      onClick={() => isClickable && handleStepClick(stepNumber)}
                    >
                      <div className="ht-pawty-step-circle">
                        <span>{stepNumber}</span>
                      </div>
                      <span className="ht-pawty-step-label">{step}</span>
                    </div>
                  );
                })}
                <div 
  className={`ht-pawty-step ${showConfirmation ? 'ht-pawty-step-active' : ''}`}
>
  <div className="ht-pawty-step-circle">
    <span>4</span>
  </div>
  <span className="ht-pawty-step-label">Confirmed</span>
</div>
              </div>
            </div>
          </Col>
        </Row>

        {/* CONFIRMATION PAGE - Inside BookPawty */}
        {showConfirmation && (
          <Row className="ht-pawty-confirmation-row">
            <Col md={10} lg={8} xl={6}>
              <Card className="ht-pawty-confirmation-card">
                <Card.Body>
                  <div className="ht-pawty-checkmark-large ht-pawty-checkmark-green">✓</div> {/* Added green class */}
                  <h2 className="ht-pawty-confirmation-title">Appointment Confirmed!</h2>
                  <p className="ht-pawty-confirmation-message">
                    Thank you for booking a birthday pawty for {selectedPet?.name || 'your pet'}!
                  </p>
                  <Button 
                    className="ht-pawty-back-home-btn"
                    onClick={handleBackToHome}
                  >
                    Back to Home Page
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Step 1: Select Pet */}
        {!showConfirmation && activeStep === 1 && (
          <Row className="ht-pawty-pet-row">
            <Col md={10} lg={8} xl={6}>
              <Card className="ht-pawty-pet-card">
                <Card.Body>
                  <Card.Title className="ht-pawty-card-title">
                    Who are we celebrating?
                  </Card.Title>
                  
                  <div className="ht-pawty-pets-grid">
                    {isLoadingPets ? (
                      <div className="ht-pawty-empty-state">
                        <p className="ht-pawty-empty-text">Loading your pets...</p>
                      </div>
                    ) : (
                      <>
                        {petsError && (
                          <Alert variant="danger" className="ht-pawty-alert-error ht-pawty-empty-alert">
                            {petsError}
                          </Alert>
                        )}

                        {pets.map(pet => (
                          <div 
                            key={pet.id} 
                            className={`ht-pawty-pet-item ${pet.selected ? 'ht-pawty-pet-selected' : ''}`}
                            onClick={() => handleSelectPet(pet.id)}
                          >
                            {pet.photoDataUrl ? (
                              <img
                                src={pet.photoDataUrl}
                                alt={`${pet.name} preview`}
                                className="ht-pawty-pet-photo"
                              />
                            ) : (
                              <div className={`ht-pawty-pet-avatar ${getPetTypeClass(pet.type)}`}>
                                {pet.type.charAt(0)}
                              </div>
                            )}
                            <div className="ht-pawty-pet-info">
                              <h5 className="ht-pawty-pet-name">{pet.name}</h5>
                              <p className="ht-pawty-pet-details">{pet.breed} | {pet.size} | {pet.age}</p>
                              <p className="ht-pawty-pet-parent">Owner: {pet.parentName}</p>
                            </div>
                            {pet.selected && <div className="ht-pawty-pet-checkmark">{"\u2713"}</div>}
                            <button 
                              className="ht-pawty-pet-edit-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditPet(pet);
                              }}
                            >
                              Edit
                            </button>
                          </div>
                        ))}

                        {pets.length === 0 && !petsError && (
                          <div className="ht-pawty-empty-state">
                            <p className="ht-pawty-empty-text">No pets yet. Add your first pet to continue booking.</p>
                          </div>
                        )}

                        <div 
                          className="ht-pawty-pet-item ht-pawty-add-pet"
                          onClick={handleAddPet}
                        >
                          <div className="ht-pawty-add-pet-icon">+</div>
                          <div className="ht-pawty-add-pet-text">{pets.length > 0 ? 'Add another pet' : 'Add your first pet'}</div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="ht-pawty-continue-container">
                    <Button className="ht-pawty-continue-btn" onClick={handleContinue} disabled={isLoadingPets || !selectedPet}>
                      Continue to Party Details
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Step 2: Party Details */}
        {!showConfirmation && activeStep === 2 && (
          <Row className="ht-pawty-service-row">
            <Col md={10} lg={8} xl={6}>
              <Card className="ht-pawty-service-card">
                <Card.Body>
                  <Card.Title className="ht-pawty-card-title">
                    Party Details
                  </Card.Title>
                  <p className="ht-pawty-service-subtitle">
                    Customize your pet's birthday celebration
                  </p>
                  
                  <Form>
                    <div className="ht-pawty-form-section">
                      <h4 className="ht-pawty-form-title">Owner Information</h4>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Your Name *</Form.Label>
                            <Form.Control
                              type="text"
                              value={selectedPet?.parentName || ''}
                              readOnly
                              className="ht-pawty-form-control"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Email *</Form.Label>
                            <Form.Control
                              type="email"
                              value={selectedPet?.parentEmail || ''}
                              readOnly
                              className="ht-pawty-form-control"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Phone Number *</Form.Label>
                            <Form.Control
                              type="tel"
                              value={selectedPet?.parentPhone || ''}
                              readOnly
                              className="ht-pawty-form-control"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Number of Guests *</Form.Label>
                            <Form.Select
                              value={guests}
                              onChange={(e) => setGuests(e.target.value)}
                              className="ht-pawty-form-control"
                            >
                              <option value="1-5">1-5 guests</option>
                              <option value="6-10">6-10 guests</option>
                              <option value="11-15">11-15 guests</option>
                              <option value="16+">16+ guests</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                    </div>

                    <div className="ht-pawty-form-section">
                      <h4 className="ht-pawty-form-title">Party Type</h4>
                      <Form.Group className="mb-3">
                        <div className="ht-pawty-radio-group">
                          <Form.Check
                            type="radio"
                            id="barkday"
                            name="partyType"
                            value="barkday"
                            checked={selectedPet?.type === 'Dog'}
                            onChange={() => {}}
                            label="Barkday (Dog)"
                            className="ht-pawty-radio"
                            disabled
                          />
                          <Form.Check
                            type="radio"
                            id="meowday"
                            name="partyType"
                            value="meowday"
                            checked={selectedPet?.type === 'Cat'}
                            onChange={() => {}}
                            label="Meowday (Cat)"
                            className="ht-pawty-radio"
                            disabled
                          />
                        </div>
                      </Form.Group>
                    </div>

                    <div className="ht-pawty-form-section">
                      <h4 className="ht-pawty-form-title">Pet Photo</h4>
                      <p className="ht-pawty-service-subtitle">
                        Add your celebrant's photo for reference.
                      </p>
                      <Form.Group className="mb-0">
                        <div className="ht-pawty-photo-upload-card">
                          {selectedPet?.photoDataUrl ? (
                            <div className="ht-pawty-photo-preview-wrap">
                              <img
                                src={selectedPet.photoDataUrl}
                                alt={`${selectedPet.name || 'Pet'} preview`}
                                className="ht-pawty-photo-preview"
                              />
                              <div className="ht-pawty-photo-preview-meta">
                                <span className="ht-pawty-photo-preview-name">
                                  {selectedPet.photoName || 'Pet photo selected'}
                                </span>
                                <Button
                                  type="button"
                                  variant="outline-secondary"
                                  onClick={handleRemovePetPhoto}
                                  className="ht-pawty-remove-photo-btn"
                                >
                                  Remove Photo
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <label className="ht-pawty-photo-upload-label">
                              <Form.Control
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp"
                                onChange={handlePetPhotoChange}
                                className="ht-pawty-upload-input"
                              />
                              <span className="ht-pawty-photo-upload-title">Upload your pet's photo</span>
                              <span className="ht-pawty-photo-upload-hint">JPG, PNG, or WEBP up to 1MB</span>
                            </label>
                          )}
                        </div>
                      </Form.Group>
                    </div>

                    <div className="ht-pawty-form-section">
                      <h4 className="ht-pawty-form-title">Party Date & Time</h4>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Party Date *</Form.Label>
                            <Form.Control
                              type="date"
                              value={partyDate}
                              onChange={(e) => setPartyDate(e.target.value)}
                              isInvalid={!!errors.partyDate}
                              min={new Date().toISOString().split('T')[0]}
                              className="ht-pawty-form-control"
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.partyDate}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Party Time *</Form.Label>
                            <Form.Select
                              value={partyTime}
                              onChange={(e) => setPartyTime(e.target.value)}
                              isInvalid={!!errors.partyTime}
                              className="ht-pawty-form-control"
                            >
                              <option value="">Select a time</option>
                              <option value="10:00">10:00 AM</option>
                              <option value="12:00">12:00 PM</option>
                              <option value="14:00">2:00 PM</option>
                              <option value="16:00">4:00 PM</option>
                              <option value="18:00">6:00 PM</option>
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                              {errors.partyTime}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>
                    </div>

                    <div className="ht-pawty-form-section">
                      <h4 className="ht-pawty-form-title">Package Customization</h4>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Banner Name *</Form.Label>
                            <Form.Control
                              type="text"
                              value={bannerName}
                              onChange={(e) => setBannerName(e.target.value)}
                              isInvalid={!!errors.bannerName}
                              placeholder="Name to display on birthday banner"
                              className="ht-pawty-form-control"
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.bannerName}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Cake Flavor *</Form.Label>
                            <Form.Select
                              value={cakeFlavor}
                              onChange={(e) => setCakeFlavor(e.target.value)}
                              className="ht-pawty-form-control"
                            >
                              {cakeFlavors.map(flavor => (
                                <option key={flavor.value} value={flavor.value}>
                                  {flavor.label}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Pasta Pan *</Form.Label>
                            <Form.Select
                              value={pastaChoice}
                              onChange={(e) => setPastaChoice(e.target.value)}
                              className="ht-pawty-form-control"
                            >
                              <option value="baked-mac">Baked Macaroni</option>
                              <option value="chicken-alfredo">Chicken Alfredo</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Party Hat Color *</Form.Label>
                            <div className="ht-pawty-radio-group">
                              <Form.Check
                                type="radio"
                                id="blue"
                                name="hatColor"
                                value="blue"
                                checked={hatColor === 'blue'}
                                onChange={(e) => setHatColor(e.target.value)}
                                label="Blue"
                                className="ht-pawty-radio"
                              />
                              <Form.Check
                                type="radio"
                                id="pink"
                                name="hatColor"
                                value="pink"
                                checked={hatColor === 'pink'}
                                onChange={(e) => setHatColor(e.target.value)}
                                label="Pink"
                                className="ht-pawty-radio"
                              />
                            </div>
                          </Form.Group>
                        </Col>
                      </Row>
                    </div>

                    <div className="ht-pawty-form-section">
                      <h4 className="ht-pawty-form-title">
                        ₱800 Consumables Selection
                        <span className="ht-pawty-consumables-total">Current Total: ₱{consumablesTotal}/800</span>
                      </h4>
                      
                      {errors.consumables && (
                        <Alert variant="danger" className="ht-pawty-alert-error">
                          {errors.consumables}
                        </Alert>
                      )}

                      {selectedConsumables.length > 0 && (
                        <div className="ht-pawty-selected-consumables">
                          <h5>Selected Items:</h5>
                          <div className="ht-pawty-selected-items">
                            {selectedConsumables.map(item => (
                              <div key={item.id} className="ht-pawty-selected-item">
                                <div className="ht-pawty-item-info">
                                  <span className="ht-pawty-item-name">{item.name}</span>
                                  <span className="ht-pawty-item-price">₱{item.price} × {item.quantity}</span>
                                </div>
                                <div className="ht-pawty-item-actions">
                                  <div className="ht-pawty-quantity-controls">
                                    <button 
                                      className="ht-pawty-quantity-btn"
                                      onClick={(e) => updateConsumableQuantity(e, item.id, item.quantity - 1)}
                                      type="button"
                                    >
                                      -
                                    </button>
                                    <span className="ht-pawty-quantity">{item.quantity}</span>
                                    <button 
                                      className="ht-pawty-quantity-btn"
                                      onClick={(e) => updateConsumableQuantity(e, item.id, item.quantity + 1)}
                                      type="button"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <button 
                                    className="ht-pawty-remove-item"
                                    onClick={(e) => removeConsumable(e, item.id)}
                                    type="button"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="ht-pawty-consumables-category">
                        <h5>BEVERAGES</h5>
                        <div className="ht-pawty-subcategory">
                          <h6>ICED COFFEE (16OZ)</h6>
                          <div className="ht-pawty-menu-items">
                            {menuItems.beverages
                              .filter(item => item.category === 'ICED COFFEE (16OZ)')
                              .map(item => (
                                <div 
                                  key={item.id}
                                  className={`ht-pawty-menu-item ${selectedConsumables.find(i => i.id === item.id) ? 'ht-pawty-item-selected' : ''}`}
                                  onClick={() => handleConsumableSelect(item)}
                                >
                                  <span className="ht-pawty-item-name">{item.name}</span>
                                  <span className="ht-pawty-item-price">₱{item.price}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                        <div className="ht-pawty-subcategory">
                          <h6>NON-CAFFEINE</h6>
                          <div className="ht-pawty-menu-items">
                            {menuItems.beverages
                              .filter(item => item.category === 'NON-CAFFEINE')
                              .map(item => (
                                <div 
                                  key={item.id}
                                  className={`ht-pawty-menu-item ${selectedConsumables.find(i => i.id === item.id) ? 'ht-pawty-item-selected' : ''}`}
                                  onClick={() => handleConsumableSelect(item)}
                                >
                                  <span className="ht-pawty-item-name">{item.name}</span>
                                  <span className="ht-pawty-item-price">₱{item.price}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>

                      <div className="ht-pawty-consumables-category">
                        <h5>FOOD</h5>
                        <div className="ht-pawty-subcategory">
                          <h6>RICE MEALS</h6>
                          <div className="ht-pawty-menu-items">
                            {menuItems.food
                              .filter(item => item.category === 'RICE MEALS')
                              .map(item => (
                                <div 
                                  key={item.id}
                                  className={`ht-pawty-menu-item ${selectedConsumables.find(i => i.id === item.id) ? 'ht-pawty-item-selected' : ''}`}
                                  onClick={() => handleConsumableSelect(item)}
                                >
                                  <span className="ht-pawty-item-name">{item.name}</span>
                                  <span className="ht-pawty-item-price">₱{item.price}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                        <div className="ht-pawty-subcategory">
                          <h6>SNACKS AND PASTA</h6>
                          <div className="ht-pawty-menu-items">
                            {menuItems.food
                              .filter(item => item.category === 'SNACKS AND PASTA')
                              .map(item => (
                                <div 
                                  key={item.id}
                                  className={`ht-pawty-menu-item ${selectedConsumables.find(i => i.id === item.id) ? 'ht-pawty-item-selected' : ''}`}
                                  onClick={() => handleConsumableSelect(item)}
                                >
                                  <span className="ht-pawty-item-name">{item.name}</span>
                                  <span className="ht-pawty-item-price">₱{item.price}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="ht-pawty-form-section">
                      <h4 className="ht-pawty-form-title">Special Requests</h4>
                      <Form.Group className="mb-3">
                        <Form.Label>Additional Notes</Form.Label>
                        <Form.Control
                          as="textarea"
                          value={specialRequests}
                          onChange={(e) => setSpecialRequests(e.target.value)}
                          rows={4}
                          placeholder="Any allergies, dietary restrictions, special decoration requests, or other notes..."
                          className="ht-pawty-form-control"
                        />
                      </Form.Group>
                    </div>

                    <div className="ht-pawty-form-section">
                      <h4 className="ht-pawty-form-title">Terms and Conditions</h4>
                      <div className="alert alert-light border">
                        <p className="mb-1">1. A non-refundable down payment is required to confirm reservation.</p>
                        <p className="mb-1">2. Date changes must be requested at least 48 hours before the event.</p>
                        <p className="mb-1">3. Final guest count and add-ons should be finalized before event day.</p>
                        <p className="mb-1">4. Outside food and decorations require prior approval.</p>
                        <p className="mb-0">5. Late arrival may shorten the allotted celebration time.</p>
                      </div>
                      <Form.Check
                        type="checkbox"
                        id="pawty-terms"
                        label="I have read and agree to the Terms and Conditions."
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        isInvalid={!!errors.terms}
                      />
                      {errors.terms && (
                        <div className="text-danger small mt-1">{errors.terms}</div>
                      )}
                    </div>

                  </Form>
                  
                  <div className="ht-pawty-navigation-container">
                    <div className="ht-pawty-navigation-buttons">
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => setActiveStep(1)}
                        className="ht-pawty-back-btn"
                      >
                        Back
                      </Button>
                      <Button 
                        variant="primary" 
                        onClick={handleContinueToPayment}
                        className="ht-pawty-confirm-btn"
                        disabled={!bannerName || !partyDate || !partyTime || consumablesTotal < 100 || !acceptedTerms}
                      >
                        Continue to Payment
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Step 3: Payment */}
        {!showConfirmation && activeStep === 3 && (
          <Row className="ht-pawty-service-row">
            <Col md={10} lg={8} xl={6}>
              <Card className="ht-pawty-service-card">
                <Card.Body>
                  <Card.Title className="ht-pawty-card-title">
                    Payment
                  </Card.Title>
                  <p className="ht-pawty-service-subtitle">
                    Complete your booking with payment details
                  </p>

                  <div className="ht-pawty-form-section">
                    <h4 className="ht-pawty-form-title">Booking Summary</h4>
                    
                    <div className="ht-pawty-summary-grid">
                      <div className="ht-pawty-summary-item">
                        <h5>Pet Information</h5>
                        {selectedPet && (
                          <div className="ht-pawty-summary-pet">
                            {selectedPet.photoDataUrl ? (
                              <img
                                src={selectedPet.photoDataUrl}
                                alt={`${selectedPet.name} preview`}
                                className="ht-pawty-pet-photo ht-pawty-summary-photo"
                              />
                            ) : (
                              <div className={`ht-pawty-pet-avatar ${getPetTypeClass(selectedPet.type)}`}>
                                {selectedPet.type.charAt(0)}
                              </div>
                            )}
                            <div className="ht-pawty-summary-pet-info">
                              <h6>{selectedPet.name}</h6>
                              <p>{selectedPet.type} • {selectedPet.breed} • {selectedPet.size}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="ht-pawty-summary-item">
                        <h5>Party Details</h5>
                        <p><strong>Date:</strong> {partyDate}</p>
                        <p><strong>Time:</strong> {partyTime}</p>
                        <p><strong>Guests:</strong> {guests}</p>
                      </div>

                      <div className="ht-pawty-summary-item">
                        <h5>Package Details</h5>
                        <p><strong>Banner:</strong> {bannerName}</p>
                        <p><strong>Cake:</strong> {cakeFlavors.find(f => f.value === cakeFlavor)?.label}</p>
                        <p><strong>Pasta:</strong> {pastaChoice === 'baked-mac' ? 'Baked Macaroni' : 'Chicken Alfredo'}</p>
                        <p><strong>Hat:</strong> {hatColor}</p>
                      </div>

                      <div className="ht-pawty-summary-item">
                        <h5>Consumables</h5>
                        {selectedConsumables.length === 0 ? (
                          <p>No items selected</p>
                        ) : (
                          <>
                            <div className="ht-pawty-consumables-summary">
                              {selectedConsumables.slice(0, 3).map(item => (
                                <div key={item.id} className="ht-pawty-consumable-summary-item">
                                  <span>{item.name} × {item.quantity}</span>
                                  <span>₱{item.price * item.quantity}</span>
                                </div>
                              ))}
                              {selectedConsumables.length > 3 && (
                                <p className="ht-pawty-consumables-more">+{selectedConsumables.length - 3} more items</p>
                              )}
                            </div>
                            <div className="ht-pawty-consumables-total-summary">
                              <strong>Total: ₱{consumablesTotal}/800</strong>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="ht-pawty-price-summary">
                      <div className="ht-pawty-package-price">
                        <h5>Package Price</h5>
                        <div className="ht-pawty-price-display ht-pawty-price-display-sm">
                          <span className="ht-pawty-price">₱2,000</span>
                          <span className="ht-pawty-price-note">/package</span>
                        </div>
                      </div>
                      
                      <div className="ht-pawty-downpayment-section">
                        <h5>Down Payment Required</h5>
                        <p className="ht-pawty-downpayment-note">
                          A down payment is required to secure your reservation. Booking is confirmed after payment verification.
                        </p>
                        
                      <div className="ht-pawty-downpayment-amount">
  <h6>Down Payment Amount *</h6>
  <div className="ht-pawty-price-display ht-pawty-price-display-xs"> {/* Changed from sm to xs */}
    <span className="ht-pawty-price">₱1,000</span>
  </div>
</div>

                        <div className="ht-pawty-payment-method">
                          <h6>Mode of Payment *</h6>
                          <div className="ht-pawty-form-control ht-pawty-payment-method-fixed">
                            GCash
                          </div>
                        </div>

                        <div className="ht-pawty-proof-upload">
                          <div className="ht-pawty-gcash-section">
                            <div className="ht-pawty-gcash-qr-card">
                              <p className="ht-pawty-gcash-qr-title">Scan the GCash QR code first</p>
                              <img
                                src={gcashQr}
                                alt="Happy Tails GCash QR code"
                                className="ht-pawty-gcash-qr-image"
                              />
                              <p className="ht-pawty-gcash-qr-note">
                                After sending your payment, upload your proof of payment below.
                              </p>
                            </div>
                          </div>
                          <h6>Upload Proof of Payment *</h6>
                          <div className="ht-pawty-upload-area">
                            <Form.Control
                              type="file"
                              accept=".jpg,.jpeg,.png"
                              onChange={handleFileChange}
                              className="ht-pawty-upload-input"
                              isInvalid={!!errors.paymentProof}
                            />
                            <div className="ht-pawty-upload-text">
                              {paymentProof ? (
                                <div className="ht-pawty-file-selected">
                                  <span className="ht-pawty-file-name">{paymentProof.name}</span>
                                  <span className="ht-pawty-file-size">
                                    ({(paymentProof.size / 1024 / 1024).toFixed(2)} MB)
                                  </span>
                                </div>
                              ) : (
                                <>
                                  <span>Click to upload or drag and drop</span>
                                  <span className="ht-pawty-upload-format">PNG, JPG up to 5MB</span>
                                </>
                              )}
                            </div>
                            <Form.Control.Feedback type="invalid">
                              {errors.paymentProof}
                            </Form.Control.Feedback>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="ht-pawty-processing-note">
                      After confirmation, our team will contact you within 24 hours to verify your payment.
                    </div>
                  </div>

                  <div className="ht-pawty-navigation-container">
                    <div className="ht-pawty-navigation-buttons">
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => setActiveStep(2)}
                        className="ht-pawty-back-btn"
                      >
                        Back
                      </Button>
                      <Button 
                        variant="primary" 
                        onClick={handleSubmit}
                        className="ht-pawty-confirm-btn"
                        disabled={isSubmitting || !paymentProof}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="ht-pawty-spinner"></span>
                            Processing...
                          </>
                        ) : (
                          'Confirm Booking & Pay'
                        )}
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>

      {/* Add/Edit Pet Modal */}
      <Modal 
        show={showModal} 
        onHide={handleBack}
        className="ht-pawty-pet-modal"
        centered
        size="lg"
      >
        <Modal.Header closeButton className="ht-pawty-modal-header">
          <Modal.Title>
            {isEditing ? 'Edit Pet Information' : 'Add New Pet'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="ht-pawty-modal-body">
          <div className="ht-pawty-form-section">
            <h4 className="ht-pawty-form-title">Pet Information</h4>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Pet Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={petForm.name}
                    onChange={handleFormChange}
                    placeholder="Enter pet name"
                    className="ht-pawty-form-control"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Pet Type *</Form.Label>
                  <Form.Select
                    name="type"
                    value={petForm.type}
                    onChange={handleFormChange}
                    className="ht-pawty-form-control"
                  >
                    {petTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Size *</Form.Label>
                  <Form.Select
                    name="size"
                    value={petForm.size}
                    onChange={handleFormChange}
                    className="ht-pawty-form-control"
                  >
                    {petSizes.map(size => (
                      <option key={size.value} value={size.value}>{size.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Breed *</Form.Label>
                  <Form.Control
                    type="text"
                    name="breed"
                    value={petForm.breed}
                    onChange={handleFormChange}
                    placeholder="Enter breed"
                    className="ht-pawty-form-control"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-4">
              <Form.Label>Age *</Form.Label>
              <Form.Control
                type="text"
                name="age"
                value={petForm.age}
                onChange={handleFormChange}
                placeholder="e.g., 2 years"
                className="ht-pawty-form-control"
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Birthday</Form.Label>
              <Form.Control
                type="date"
                name="birthday"
                value={petForm.birthday}
                onChange={handleFormChange}
                className="ht-pawty-form-control"
              />
            </Form.Group>



          </div>

          <div className="ht-pawty-form-section">
            <h4 className="ht-pawty-form-title">Pet Parent Information</h4>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="parentName"
                    value={petForm.parentName}
                    onChange={handleFormChange}
                    placeholder="Enter your full name"
                    className="ht-pawty-form-control"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number *</Form.Label>
                  <Form.Control
                    type="tel"
                    name="parentPhone"
                    value={petForm.parentPhone}
                    onChange={handleFormChange}
                    placeholder="09123456789"
                    className="ht-pawty-form-control"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Email Address *</Form.Label>
              <Form.Control
                type="email"
                name="parentEmail"
                value={petForm.parentEmail}
                onChange={handleFormChange}
                placeholder="you@example.com"
                className="ht-pawty-form-control"
              />
            </Form.Group>
            
            <Form.Group className="mb-4">
              <Form.Label>Address (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="parentAddress"
                value={petForm.parentAddress}
                onChange={handleFormChange}
                placeholder="Enter your address"
                className="ht-pawty-form-control"
              />
            </Form.Group>

          </div>
          
          {modalError && (
            <Alert variant="danger" className="ht-pawty-alert-error">
              {modalError}
            </Alert>
          )}

          <div className="ht-pawty-required-note">
            * Required fields
          </div>
        </Modal.Body>
        <Modal.Footer className="ht-pawty-modal-footer">
          <div className="ht-pawty-modal-actions">
            {isEditing && (
              <Button 
                variant="outline-danger" 
                onClick={() => void handleDeletePet()}
                className="ht-pawty-delete-btn"
                disabled={pets.length <= 1 || isSavingPet || isDeletingPet}
              >
                {isDeletingPet ? 'Deleting...' : 'Delete Pet'}
              </Button>
            )}
            <div className="ht-pawty-modal-buttons">
              <Button 
                variant="outline-secondary" 
                onClick={handleBack}
                className="ht-pawty-back-modal-btn"
                disabled={isSavingPet || isDeletingPet}
              >
                Back
              </Button>
              <Button 
                variant="primary" 
                onClick={() => void handleSavePet()}
                className="ht-pawty-save-btn"
                disabled={!petForm.name || !petForm.breed || !petForm.age || 
                         !petForm.parentName || !petForm.parentPhone || !petForm.parentEmail ||
                         isSavingPet || isDeletingPet}
              >
                {isSavingPet ? (
                  isEditing ? 'Updating...' : 'Saving...'
                ) : (
                  isEditing ? 'Update Pet Info' : 'Save Pet Info'
                )}
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BookPawty;
