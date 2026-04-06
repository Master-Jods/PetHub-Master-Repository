import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Alert, Container, Row, Col, Card, Button, ProgressBar, Form, Modal } from 'react-bootstrap';
import { useAuth } from '../backend/context/AuthContext';
import { supabase } from '../backend/supabaseClient';
import './BoardingBook.css';

const parsePetNotes = (value) => {
  if (!value || typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (_error) {
    return {};
  }
};

const normalizePetType = (value) => {
  const text = String(value || '').toLowerCase();
  if (text.includes('cat')) return 'Cat';
  return 'Dog';
};

const normalizePetSize = (value) => {
  const text = String(value || '').trim();
  if (text === 'Small' || text === 'Medium' || text === 'Large' || text === 'XL') return text;
  if (text === 'ExtraLarge') return 'XL';
  return 'Medium';
};

const BoardingBook = () => {
  const navigate = useNavigate();
  const { user: authUser, profile } = useAuth();
  const [activeStep, setActiveStep] = useState(1);
  const steps = ['Information', 'Service Details', 'Confirmation'];
  const timeOptions = [
    { value: '10:00', label: '10:00 AM' },
    { value: '12:00', label: '12:00 PM' },
    { value: '14:00', label: '2:00 PM' },
    { value: '16:00', label: '4:00 PM' },
    { value: '18:00', label: '6:00 PM' },
  ];
  
  const [pets, setPets] = useState([]);
  const [isLoadingPets, setIsLoadingPets] = useState(true);
  const [petsError, setPetsError] = useState('');

  const [serviceType, setServiceType] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingPet, setIsSavingPet] = useState(false);
  const [isDeletingPet, setIsDeletingPet] = useState(false);
  const [modalError, setModalError] = useState('');
  
  const [petForm, setPetForm] = useState({
    name: '',
    type: 'Dog',
    size: 'Medium',
    breed: '',
    age: '',
    birthday: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    parentAddress: ''
  });

  const petTypes = ['Dog', 'Cat'];
  const petSizes = [
    { value: 'Small', label: 'Small (Below 5kg)' },
    { value: 'Medium', label: 'Medium (6-10kg)' },
    { value: 'Large', label: 'Large (11-30kg)' },
    { value: 'XL', label: 'XL (31kg & up)' }
  ];

  const ownerDefaults = {
    parentName: [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim(),
    parentPhone: profile?.phone || '',
    parentEmail: authUser?.email || '',
    parentAddress: '',
  };

  const mapRowToPet = (row) => {
    const details = parsePetNotes(row.notes);
    const rowBirthday = row.birth_date ? String(row.birth_date).slice(0, 10) : '';

    return {
      id: row.id,
      name: row.name || 'Pet',
      type: normalizePetType(row.species),
      size: normalizePetSize(details.size),
      breed: row.breed || 'Unknown breed',
      age: details.age || '',
      birthday: details.birthday || rowBirthday,
      selected: false,
      parentName: details.parentName || ownerDefaults.parentName || '',
      parentPhone: details.parentPhone || ownerDefaults.parentPhone || '',
      parentEmail: details.parentEmail || ownerDefaults.parentEmail || '',
      parentAddress: details.parentAddress || ownerDefaults.parentAddress || '',
    };
  };

  const serializePetNotes = (form) => JSON.stringify({
    size: form.size || 'Medium',
    age: form.age?.trim() || '',
    birthday: form.birthday || '',
    parentName: form.parentName?.trim() || '',
    parentPhone: form.parentPhone?.trim() || '',
    parentEmail: form.parentEmail?.trim() || '',
    parentAddress: form.parentAddress?.trim() || '',
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
        .from('user_pets')
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
  }, [authUser?.email, authUser?.id, profile?.first_name, profile?.last_name, profile?.phone]);

  const serviceTypes = [
    { 
      type: 'DAYCARE', 
      duration: '3 hours', 
      description: 'Includes water, supervised playtime, and photo and video updates during your pet\'s stay.',
      price: 'PHP 409.00 - Medium',
      additionalInfo: 'P50.00 per hour for every succeeding hour'
    },
    { 
      type: 'OVERNIGHT', 
      duration: '24 hours', 
      description: 'Includes a dedicated 24/7 pet attendant, water, and regular photo and video updates for fur parents.',
      price: 'PHP 409.00 - Medium',
      additionalInfo: 'P50.00 per hour for every succeeding hour'
    }
  ];

  const handleAddPet = () => {
    setIsEditing(false);
    setEditingPet(null);
    setModalError('');
    setPetForm({
      name: '',
      type: 'Dog',
      size: 'Medium',
      breed: '',
      age: '',
      birthday: '',
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
        .from('user_pets')
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
      .from('user_pets')
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
      .from('user_pets')
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

  const handleStepClick = (stepNumber) => {
    console.log('Step clicked:', stepNumber);
    
    switch(stepNumber) {
      case 1:
        setActiveStep(1);
        break;
      case 2:
        const selectedPets = pets.filter(pet => pet.selected);
        if (selectedPets.length === 0) {
          alert('Please select at least one pet for boarding');
          return;
        }
        setActiveStep(2);
        break;
      case 3:
        if (!serviceType || !checkInDate || !checkInTime || !checkOutDate || !checkOutTime) {
          alert('Please complete service details first.');
          return;
        }
        if (!acceptedTerms) {
          alert('Please agree to the Terms and Conditions first.');
          return;
        }
        const selectedPetsForBooking = pets.filter(pet => pet.selected);
        navigate('/boarding-confirmed', { 
          state: { 
            selectedPets: selectedPetsForBooking,
            serviceType: serviceType,
            checkInDate: checkInDate,
            checkInTime: checkInTime,
            checkOutDate: checkOutDate,
            checkOutTime: checkOutTime
          } 
        });
        break;
      default:
        break;
    }
  };

  const handleContinue = () => {
    const selectedPets = pets.filter(pet => pet.selected);
    if (selectedPets.length === 0) {
      alert('Please select at least one pet for boarding');
      return;
    }
    setActiveStep(2);
  };

  const handleContinueToConfirmation = () => {
    if (!serviceType || !checkInDate || !checkInTime || !checkOutDate || !checkOutTime) {
      alert('Please complete all service details');
      return;
    }
    if (!acceptedTerms) {
      alert('Please agree to the Terms and Conditions first.');
      return;
    }
    
    const selectedPets = pets.filter(pet => pet.selected);
    navigate('/boarding-confirmed', { 
      state: { 
        selectedPets: selectedPets,
        serviceType: serviceType,
        checkInDate: checkInDate,
        checkInTime: checkInTime,
        checkOutDate: checkOutDate,
        checkOutTime: checkOutTime
      } 
    });
  };

  const handleBack = () => {
    setModalError('');
    setShowModal(false);
  };

  const getProgressPercentage = () => {
    switch(activeStep) {
      case 1: return 33;
      case 2: return 66;
      case 3: return 100;
      default: return 33;
    }
  };

  return (
    <div className="ht-boarding-book">
      <Container className="ht-boarding-container">
        <Row className="ht-boarding-title-row">
          <Col>
            <h1 className="ht-boarding-main-title">Book Your Pet's Boarding Stay</h1>
            <p className="ht-boarding-subtitle">
              Follow the simple steps below to book your pet's home away from home.
            </p>
          </Col>
        </Row>

        <Row className="ht-boarding-progress-row">
          <Col>
            <div className="ht-boarding-progress-steps">
              <ProgressBar now={getProgressPercentage()} className="ht-boarding-progress-bar" />
              <div className="ht-boarding-step-indicators">
                {steps.map((step, index) => {
                  const stepNumber = index + 1;
                  const isClickable = stepNumber <= 3;
                  
                  return (
                    <div 
                      key={index} 
                      className={`ht-boarding-step ${stepNumber === activeStep ? 'ht-boarding-step-active' : ''} ${isClickable ? 'ht-boarding-step-clickable' : ''}`}
                      onClick={() => isClickable && handleStepClick(stepNumber)}
                    >
                      <div className="ht-boarding-step-circle">
                        <span>{stepNumber}</span>
                      </div>
                      <span className="ht-boarding-step-label">{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Col>
        </Row>

        {/* Step 1: Pet Information */}
        {activeStep === 1 && (
          <Row className="ht-boarding-pet-row">
            <Col md={10} lg={8} xl={6}>
              <Card className="ht-boarding-pet-card">
                <Card.Body>
                  <Card.Title className="ht-boarding-card-title">
                    Who will be staying with us?
                  </Card.Title>
                  
                  {petsError && (
                    <Alert variant="danger" className="ht-boarding-alert">
                      {petsError}
                    </Alert>
                  )}

                  {isLoadingPets ? (
                    <div className="ht-boarding-empty-state">
                      <p className="ht-boarding-empty-text">Loading your pets...</p>
                    </div>
                  ) : (
                    <>
                      {pets.length === 0 ? (
                        <div className="ht-boarding-empty-state">
                          <p className="ht-boarding-empty-text">Add your first pet to continue with boarding.</p>
                          <Button className="ht-boarding-continue-btn" onClick={handleAddPet}>
                            Add your first pet
                          </Button>
                        </div>
                      ) : (
                        <div className="ht-boarding-pets-grid">
                          {pets.map(pet => (
                            <div 
                              key={pet.id} 
                              className={`ht-boarding-pet-item ${pet.selected ? 'ht-boarding-pet-selected' : ''}`}
                              onClick={() => handleSelectPet(pet.id)}
                            >
                              <div className={`ht-boarding-pet-avatar ht-boarding-pet-${pet.type.toLowerCase()}`}>
                                {pet.type.charAt(0)}
                              </div>
                              <div className="ht-boarding-pet-info">
                                <h5 className="ht-boarding-pet-name">{pet.name}</h5>
                                <p className="ht-boarding-pet-details">{pet.breed} - {pet.size} Size - {pet.age || 'Age not set'}</p>
                                <p className="ht-boarding-pet-parent">Owner: {pet.parentName || ownerDefaults.parentName || 'Not provided'}</p>
                              </div>
                              {pet.selected && <div className="ht-boarding-pet-checkmark">&#10003;</div>}
                              <button 
                                type="button"
                                className="ht-boarding-pet-edit-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditPet(pet);
                                }}
                              >
                                Edit
                              </button>
                            </div>
                          ))}
                          
                          <button 
                            type="button"
                            className="ht-boarding-pet-item ht-boarding-add-pet"
                            onClick={handleAddPet}
                          >
                            <div className="ht-boarding-add-pet-icon">+</div>
                            <div className="ht-boarding-add-pet-text">Add another pet</div>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="ht-boarding-continue-container">
                    <Button className="ht-boarding-continue-btn" onClick={handleContinue} disabled={isLoadingPets || pets.filter(pet => pet.selected).length === 0}>
                      Continue to Service Details
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Step 2: Service Details */}
        {activeStep === 2 && (
          <Row className="ht-boarding-service-row">
            <Col md={10} lg={8} xl={6}>
              <Card className="ht-boarding-service-card">
                <Card.Body>
                  <Card.Title className="ht-boarding-card-title">
                    Service Details
                  </Card.Title>
                  <p className="ht-boarding-service-subtitle">
                    Select the boarding service that fits your schedule.
                  </p>
                  
                  <div className="ht-boarding-service-options">
                    {serviceTypes.map((service, index) => (
                      <div 
                        key={index}
                        className={`ht-boarding-service-option ${serviceType === service.type ? 'ht-boarding-service-selected' : ''}`}
                        onClick={() => setServiceType(service.type)}
                      >
                        <div className="ht-boarding-service-header">
                          <h4 className="ht-boarding-service-type">{service.type}</h4>
                          <span className="ht-boarding-service-duration">{service.duration}</span>
                        </div>
                        <p className="ht-boarding-service-description">{service.description}</p>
                        <div className="ht-boarding-service-pricing">
                          <span className="ht-boarding-service-price">{service.price}</span>
                          <span className="ht-boarding-service-additional">{service.additionalInfo}</span>
                        </div>
                        {serviceType === service.type && (
                          <div className="ht-boarding-service-checkmark">&#10003;</div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="ht-boarding-dates-section">
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Check-in Date *</Form.Label>
                          <Form.Control
                            type="date"
                            value={checkInDate}
                            onChange={(e) => setCheckInDate(e.target.value)}
                            className="ht-boarding-form-control"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Check-in Time *</Form.Label>
                          <Form.Select
                            value={checkInTime}
                            onChange={(e) => setCheckInTime(e.target.value)}
                            className="ht-boarding-form-control"
                          >
                            <option value="">Select a time</option>
                            {timeOptions.map((timeOption) => (
                              <option key={`checkin-${timeOption.value}`} value={timeOption.value}>
                                {timeOption.label}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Expected Check-out Date *</Form.Label>
                          <Form.Control
                            type="date"
                            value={checkOutDate}
                            onChange={(e) => setCheckOutDate(e.target.value)}
                            className="ht-boarding-form-control"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Check-out Time *</Form.Label>
                          <Form.Select
                            value={checkOutTime}
                            onChange={(e) => setCheckOutTime(e.target.value)}
                            className="ht-boarding-form-control"
                          >
                            <option value="">Select a time</option>
                            {timeOptions.map((timeOption) => (
                              <option key={`checkout-${timeOption.value}`} value={timeOption.value}>
                                {timeOption.label}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="mt-3">
                      <h5>Terms and Conditions</h5>
                      <div className="alert alert-light border">
                        <p className="mb-1">1. A valid reservation is required before check-in.</p>
                        <p className="mb-1">2. Check-in and check-out must follow the selected schedule.</p>
                        <p className="mb-1">3. Late pick-up may incur additional hourly charges.</p>
                        <p className="mb-1">4. Owners must disclose health and behavior concerns before boarding.</p>
                        <p className="mb-0">5. Happy Tails may refuse service if safety requirements are not met.</p>
                      </div>
                      <Form.Check
                        type="checkbox"
                        id="boarding-terms"
                        label="I have read and agree to the Terms and Conditions."
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                      />
                    </div>
                  </div>
                  
                  <div className="ht-boarding-navigation-container">
                    <div className="ht-boarding-navigation-buttons">
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => setActiveStep(1)}
                        className="ht-boarding-back-btn"
                      >
                        Back
                      </Button>
                      <Button 
                        variant="primary" 
                        onClick={handleContinueToConfirmation}
                        className="ht-boarding-confirm-btn"
                        disabled={!serviceType || !checkInDate || !checkInTime || !checkOutDate || !checkOutTime || !acceptedTerms}
                      >
                        Continue to Confirmation
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
        className="ht-boarding-pet-modal"
        centered
        size="lg"
      >
        <Modal.Header closeButton className="ht-boarding-modal-header">
          <Modal.Title>
            {isEditing ? 'Edit Pet Information' : 'Add New Pet'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="ht-boarding-modal-body">
          {modalError && (
            <Alert variant="danger" className="mb-3">
              {modalError}
            </Alert>
          )}

          <div className="ht-boarding-form-section">
            <h4 className="ht-boarding-form-title">Pet Information</h4>
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
                    className="ht-boarding-form-control"
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
                    className="ht-boarding-form-control"
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
                    className="ht-boarding-form-control"
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
                    className="ht-boarding-form-control"
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
                className="ht-boarding-form-control"
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Birthday</Form.Label>
              <Form.Control
                type="date"
                name="birthday"
                value={petForm.birthday}
                onChange={handleFormChange}
                className="ht-boarding-form-control"
              />
            </Form.Group>
          </div>

          <div className="ht-boarding-form-section">
            <h4 className="ht-boarding-form-title">Pet Parent Information</h4>
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
                    className="ht-boarding-form-control"
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
                    className="ht-boarding-form-control"
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
                className="ht-boarding-form-control"
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
                className="ht-boarding-form-control"
              />
            </Form.Group>
          </div>
          
          <div className="ht-boarding-required-note">
            * Required fields
          </div>
        </Modal.Body>
        <Modal.Footer className="ht-boarding-modal-footer">
          <div className="ht-boarding-modal-actions">
            {isEditing && (
              <Button 
                variant="outline-danger" 
                onClick={handleDeletePet}
                className="ht-boarding-delete-btn"
                disabled={isDeletingPet}
              >
                {isDeletingPet ? 'Deleting...' : 'Delete Pet'}
              </Button>
            )}
            <div className="ht-boarding-modal-buttons">
              <Button 
                variant="outline-secondary" 
                onClick={handleBack}
                className="ht-boarding-back-modal-btn"
                disabled={isSavingPet || isDeletingPet}
              >
                Back
              </Button>
              <Button 
                variant="primary" 
                onClick={() => void handleSavePet()}
                className="ht-boarding-save-btn"
                disabled={isSavingPet || isDeletingPet || !petForm.name || !petForm.breed || !petForm.age || 
                         !petForm.parentName || !petForm.parentPhone || !petForm.parentEmail}
              >
                {isSavingPet ? 'Saving...' : isEditing ? 'Update Pet Info' : 'Save Pet Info'}
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BoardingBook;

