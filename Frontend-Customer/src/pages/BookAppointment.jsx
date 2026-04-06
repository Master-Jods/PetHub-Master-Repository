import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Col, Container, Form, Modal, ProgressBar, Row } from 'react-bootstrap';
import { useAuth } from '../backend/context/AuthContext';
import { supabase } from '../backend/supabaseClient';
import './BookAppointment.css';

const PET_TYPES = ['Dog', 'Cat'];
const PET_SIZES = [
  { value: 'Small', label: 'Small (below 5 kg)' },
  { value: 'Medium', label: 'Medium (6-10 kg)' },
  { value: 'Large', label: 'Large (11-30 kg)' },
  { value: 'ExtraLarge', label: 'Extra Large (31kg & up)' },
];

function normalizePetType(value) {
  const text = String(value || '').toLowerCase();
  if (text.includes('cat')) return 'Cat';
  return 'Dog';
}

function normalizePetSize(value) {
  const raw = String(value || '').trim();
  if (raw === 'Small' || raw === 'Medium' || raw === 'Large' || raw === 'ExtraLarge') return raw;
  return 'Medium';
}

function parsePetNotes(value) {
  if (!value || typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function serializePetNotes(form) {
  return JSON.stringify({
    size: form.size || 'Medium',
    age: form.age?.trim() || '',
    birthday: form.birthday || '',
    parentName: form.parentName?.trim() || '',
    parentPhone: form.parentPhone?.trim() || '',
    parentEmail: form.parentEmail?.trim() || '',
    parentAddress: form.parentAddress?.trim() || '',
  });
}

function buildDefaultOwner(profile, user) {
  const fullName = [profile?.first_name, profile?.last_name]
    .filter((part) => String(part || '').trim().length > 0)
    .join(' ')
    .trim();

  return {
    parentName: fullName || '',
    parentPhone: profile?.phone || '',
    parentEmail: user?.email || '',
    parentAddress: '',
  };
}

function emptyPetForm(ownerDefaults) {
  return {
    name: '',
    type: 'Dog',
    size: 'Medium',
    breed: '',
    age: '',
    birthday: '',
    parentName: ownerDefaults.parentName || '',
    parentPhone: ownerDefaults.parentPhone || '',
    parentEmail: ownerDefaults.parentEmail || '',
    parentAddress: ownerDefaults.parentAddress || '',
  };
}

function mapRowToPet(row, ownerDefaults) {
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
    parentName: details.parentName || ownerDefaults.parentName || '',
    parentPhone: details.parentPhone || ownerDefaults.parentPhone || '',
    parentEmail: details.parentEmail || ownerDefaults.parentEmail || '',
    parentAddress: details.parentAddress || ownerDefaults.parentAddress || '',
  };
}

const BookAppointment = () => {
  const navigate = useNavigate();
  const { user: authUser, profile } = useAuth();

  const [activeStep, setActiveStep] = useState(1);
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingPets, setIsLoadingPets] = useState(true);
  const [isSavingPet, setIsSavingPet] = useState(false);
  const [isDeletingPet, setIsDeletingPet] = useState(false);
  const [petsError, setPetsError] = useState('');
  const [modalError, setModalError] = useState('');
  const [petForm, setPetForm] = useState(emptyPetForm({}));

  const steps = ['Information', 'Choose Service', 'Schedule', 'Confirmation'];
  const ownerDefaults = useMemo(() => buildDefaultOwner(profile, authUser), [profile, authUser]);

  const selectedPet = useMemo(
    () => pets.find((pet) => pet.id === selectedPetId) || null,
    [pets, selectedPetId]
  );

  const loadPets = useCallback(async () => {
    if (!supabase || !authUser?.id) {
      setIsLoadingPets(false);
      setPets([]);
      setSelectedPetId(null);
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
      setSelectedPetId(null);
      setPetsError(error.message || 'Could not load pets right now.');
      setIsLoadingPets(false);
      return;
    }

    const loadedPets = Array.isArray(data) ? data.map((row) => mapRowToPet(row, ownerDefaults)) : [];
    setPets(loadedPets);

    setSelectedPetId((currentId) => {
      if (currentId && loadedPets.some((pet) => pet.id === currentId)) return currentId;
      return loadedPets[0]?.id || null;
    });

    setIsLoadingPets(false);
  }, [authUser?.id, ownerDefaults]);

  useEffect(() => {
    void loadPets();
  }, [loadPets]);

  const handleAddPet = () => {
    setIsEditing(false);
    setEditingPet(null);
    setModalError('');
    setPetForm(emptyPetForm(ownerDefaults));
    setShowModal(true);
  };

  const handleEditPet = (pet) => {
    setIsEditing(true);
    setEditingPet(pet);
    setModalError('');
    setPetForm({
      name: pet.name || '',
      type: normalizePetType(pet.type),
      size: normalizePetSize(pet.size),
      breed: pet.breed === 'Unknown breed' ? '' : pet.breed || '',
      age: pet.age || '',
      birthday: pet.birthday || '',
      parentName: pet.parentName || ownerDefaults.parentName,
      parentPhone: pet.parentPhone || ownerDefaults.parentPhone,
      parentEmail: pet.parentEmail || ownerDefaults.parentEmail,
      parentAddress: pet.parentAddress || ownerDefaults.parentAddress,
    });
    setShowModal(true);
  };

  const handleSelectPet = (id) => {
    setSelectedPetId(id);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setPetForm((prev) => ({
      ...prev,
      [name]: value,
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

      const updatedPet = mapRowToPet(data, ownerDefaults);
      setPets((prev) => prev.map((pet) => (pet.id === editingPet.id ? updatedPet : pet)));
      setSelectedPetId((currentId) => currentId || updatedPet.id);
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

    const newPet = mapRowToPet(data, ownerDefaults);
    setPets((prev) => [...prev, newPet]);
    setSelectedPetId(newPet.id);
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
      const remainingPets = prev.filter((pet) => pet.id !== editingPet.id);
      setSelectedPetId((currentId) => {
        if (currentId !== editingPet.id) return currentId;
        return remainingPets[0]?.id || null;
      });
      return remainingPets;
    });

    setIsDeletingPet(false);
    setShowModal(false);
  };

  const navigateToChooseService = () => {
    if (!selectedPet) {
      alert('Please add and select a pet before continuing.');
      return;
    }

    navigate('/choose-service', {
      state: {
        selectedPets: [selectedPet],
        petCount: 1,
      },
    });
  };

  const handleContinue = () => {
    navigateToChooseService();
  };

  const handleStepClick = (stepNumber) => {
    switch (stepNumber) {
      case 1:
        setActiveStep(1);
        break;
      case 2:
        navigateToChooseService();
        break;
      case 3:
        alert('Please complete all previous steps first.');
        break;
      default:
        break;
    }
  };

  const handleBack = () => {
    setModalError('');
    setShowModal(false);
  };

  return (
    <div className="ht-book-appointment">
      <Container className="ht-booking-container">
        <Row className="ht-booking-title-row">
          <Col>
            <h1 className="ht-booking-main-title">Book Your Appointment</h1>
            <p className="ht-booking-subtitle">
              Follow the simple steps below to schedule your pet's grooming session.
            </p>
          </Col>
        </Row>

        <Row className="ht-booking-progress-row">
          <Col>
            <div className="ht-booking-progress-steps">
              <ProgressBar now={25} className="ht-booking-progress-bar" />
              <div className="ht-booking-step-indicators">
                {steps.map((step, index) => {
                  const stepNumber = index + 1;
                  const isClickable = stepNumber <= 2;

                  return (
                    <div
                      key={step}
                      className={`ht-booking-step ${stepNumber === activeStep ? 'ht-booking-step-active' : ''} ${isClickable ? 'ht-booking-step-clickable' : ''}`}
                      onClick={() => isClickable && handleStepClick(stepNumber)}
                    >
                      <div className="ht-booking-step-circle">
                        <span>{stepNumber}</span>
                      </div>
                      <span className="ht-booking-step-label">{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Col>
        </Row>

        <Row className="ht-booking-pet-row">
          <Col md={10} lg={8} xl={6}>
            <Card className="ht-booking-pet-card">
              <Card.Body>
                <Card.Title className="ht-booking-card-title">
                  Who needs grooming today?
                </Card.Title>

                {petsError && (
                  <Alert variant="danger" className="ht-booking-alert">
                    {petsError}
                    <div className="mt-2">
                      <Button size="sm" variant="outline-danger" onClick={() => void loadPets()}>
                        Retry
                      </Button>
                    </div>
                  </Alert>
                )}

                {isLoadingPets ? (
                  <div className="ht-booking-empty-state">
                    <p className="ht-booking-empty-text">Loading your pets...</p>
                  </div>
                ) : (
                  <>
                    {pets.length === 0 ? (
                      <div className="ht-booking-empty-state">
                        <p className="ht-booking-empty-text">
                          Add your first pet to continue with booking.
                        </p>
                        <Button className="ht-booking-continue-btn" onClick={handleAddPet}>
                          Add your first pet
                        </Button>
                      </div>
                    ) : (
                      <div className="ht-booking-pets-grid">
                        {pets.map((pet) => {
                          const isSelected = selectedPetId === pet.id;
                          return (
                            <div
                              key={pet.id}
                              className={`ht-booking-pet-item ${isSelected ? 'ht-booking-pet-selected' : ''}`}
                              onClick={() => handleSelectPet(pet.id)}
                            >
                              <div className={`ht-booking-pet-avatar ht-booking-pet-${pet.type.toLowerCase()}`}>
                                {pet.type.charAt(0)}
                              </div>
                              <div className="ht-booking-pet-info">
                                <h5 className="ht-booking-pet-name">{pet.name}</h5>
                                <p className="ht-booking-pet-details">
                                  {pet.type} - {pet.breed} - {pet.age || 'Age not set'}
                                </p>
                                <p className="ht-booking-pet-parent">
                                  Owner: {pet.parentName || ownerDefaults.parentName || 'Not provided'}
                                </p>
                              </div>
                              {isSelected && <div className="ht-booking-pet-checkmark">&#10003;</div>}
                              <button
                                type="button"
                                className="ht-booking-pet-edit-btn"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleEditPet(pet);
                                }}
                              >
                                Edit
                              </button>
                            </div>
                          );
                        })}

                        <button
                          type="button"
                          className="ht-booking-pet-item ht-booking-add-pet"
                          onClick={handleAddPet}
                        >
                          <div className="ht-booking-add-pet-icon">+</div>
                          <div className="ht-booking-add-pet-text">Add another pet</div>
                        </button>
                      </div>
                    )}
                  </>
                )}

                <div className="ht-booking-continue-container">
                  <Button
                    className="ht-booking-continue-btn"
                    onClick={handleContinue}
                    disabled={isLoadingPets || !selectedPet}
                  >
                    Continue
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <Modal
        show={showModal}
        onHide={handleBack}
        className="ht-booking-pet-modal"
        centered
        size="lg"
      >
        <Modal.Header closeButton className="ht-booking-modal-header">
          <Modal.Title>
            {isEditing ? 'Edit Pet Information' : 'Add New Pet'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="ht-booking-modal-body">
          {modalError && (
            <Alert variant="danger" className="mb-3">
              {modalError}
            </Alert>
          )}

          <div className="ht-booking-form-section">
            <h4 className="ht-booking-form-title">Pet Information</h4>
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
                    className="ht-booking-form-control"
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
                    className="ht-booking-form-control"
                  >
                    {PET_TYPES.map((type) => (
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
                    className="ht-booking-form-control"
                  >
                    {PET_SIZES.map((size) => (
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
                    className="ht-booking-form-control"
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
                placeholder="e.g., 3 years, 6 months"
                className="ht-booking-form-control"
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Birthday</Form.Label>
              <Form.Control
                type="date"
                name="birthday"
                value={petForm.birthday}
                onChange={handleFormChange}
                className="ht-booking-form-control"
              />
            </Form.Group>
          </div>

          <div className="ht-booking-form-section">
            <h4 className="ht-booking-form-title">Pet Parent Information</h4>
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
                    className="ht-booking-form-control"
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
                    className="ht-booking-form-control"
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
                className="ht-booking-form-control"
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
                className="ht-booking-form-control"
              />
            </Form.Group>
          </div>

          <div className="ht-booking-required-note">
            * Required fields
          </div>
        </Modal.Body>
        <Modal.Footer className="ht-booking-modal-footer">
          <div className="ht-booking-modal-actions">
            {isEditing && (
              <Button
                variant="outline-danger"
                onClick={handleDeletePet}
                className="ht-booking-delete-btn"
                disabled={isDeletingPet}
              >
                {isDeletingPet ? 'Deleting...' : 'Delete Pet'}
              </Button>
            )}
            <div className="ht-booking-modal-buttons">
              <Button
                variant="outline-secondary"
                onClick={handleBack}
                className="ht-booking-back-btn"
                disabled={isSavingPet || isDeletingPet}
              >
                Back
              </Button>
              <Button
                variant="primary"
                onClick={() => void handleSavePet()}
                className="ht-booking-save-btn"
                disabled={isSavingPet || isDeletingPet || !petForm.name || !petForm.breed || !petForm.age || !petForm.parentName || !petForm.parentPhone || !petForm.parentEmail}
              >
                {isSavingPet
                  ? 'Saving...'
                  : isEditing
                    ? 'Update Pet Info'
                    : 'Save Pet Info'}
              </Button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BookAppointment;
