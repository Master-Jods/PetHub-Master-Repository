import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Modal, Badge, Toast, ToastContainer, Dropdown, Tab, Nav } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../backend/context/AuthContext';
import { fetchCatalogProducts } from '../backend/services/catalogService';
import AuthModal from '../components/AuthModal';
import { SHIPPING_OPTIONS, getShippingFee } from '../constants/fulfillment';
import './Shop.css';

const Shop = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    cart, 
    addToCart, 
    updateQuantity, 
    removeFromCart, 
    getCartTotal, 
    getCartCount,
    checkoutPreferences,
    updateCheckoutPreferences,
    formatPrice,
    showToast,
    toastMessage,
    setShowToast
  } = useCart();
  
  const [sortBy, setSortBy] = useState('default');
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [cartVisible, setCartVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVariant, setSelectedVariant] = useState({});
  const [activeTab, setActiveTab] = useState('description');
  const [selectedPetType, setSelectedPetType] = useState('all');
  const [quantity, setQuantity] = useState(1);
  const [showAuth, setShowAuth] = useState(false);
  const shippingFee = getShippingFee(
    checkoutPreferences.fulfillmentMethod,
    checkoutPreferences.shippingOption
  );

  // Helper function to format currency with .00
  const formatCurrency = (amount) => {
    return `₱${amount.toFixed(2)}`;
  };

  // Sample product data - 50 products with photo placeholders and decimal prices
  const initialProducts = [
    // Pet Food & Treats (10 products)
    {
      id: 1,
      name: "Knot Bone Pet Dental Treats",
      category: "pet-food-treats",
      price: "₱9.00 - ₱10.00",
      priceRange: { min: 9, max: 10 },
      basePrice: 9,
      petType: "dog",
      description: "Dental cleaning treats that help reduce tartar and freshen breath. Available in multiple delicious flavors.",
      longDescription: "Knot Bone Dental Treats are specially designed to clean your dog's teeth while they chew. The unique texture helps scrape away plaque and tartar buildup, promoting better dental health. Made with natural ingredients and available in various flavors that dogs love.",
      image: "/src/assets/id1.jpg",
      hasVariants: true,
      variants: [
        { id: "milk", flavor: "Milk", price: 9.00 },
        { id: "banana", flavor: "Banana", price: 9.00 },
        { id: "chicken", flavor: "Chicken", price: 9.00 },
        { id: "beef", flavor: "Beef", price: 9.00 },
        { id: "bbq", flavor: "BBQ", price: 10.00 },
        { id: "lamb", flavor: "Lamb", price: 10.00 },
        { id: "strawberry", flavor: "Strawberry", price: 10.00 },
        { id: "apple", flavor: "Apple", price: 10.00 },
        { id: "blueberry", flavor: "Blueberry", price: 10.00 }
      ],
      brand: "Knot Bone",
      sold: 1200,
      inStock: true
    },
    {
      id: 2,
      name: "Dog Dental Treats in Jar",
      category: "pet-food-treats",
      price: "₱95.00",
      basePrice: 95,
      petType: "dog",
      description: "Dental hygiene treats in a reusable jar. Helps clean teeth and freshen breath with natural ingredients.",
      longDescription: "These dental treats come in a reusable jar that keeps them fresh. Formulated with natural ingredients that help reduce plaque and tartar buildup while freshening your dog's breath. Perfect for daily dental care routine.",
      image: "/src/assets/id2.jpg",
      hasVariants: true,
      variants: [
        { id: "chicken", flavor: "Chicken", price: 95.00 },
        { id: "tea", flavor: "Tea", price: 95.00 },
        { id: "beef", flavor: "Beef", price: 95.00 },
        { id: "milk", flavor: "Milk", price: 95.00 },
        { id: "mixed", flavor: "Mixed", price: 95.00 },
        { id: "strawberry", flavor: "Strawberry", price: 95.00 }
      ],
     
      brand: "Pet Dental",
      sold: 850,
      inStock: true
    },
    {
      id: 3,
      name: "JerHigh Dog Treats 70g",
      category: "pet-food-treats",
      price: "₱119.00",
      basePrice: 119,
      petType: "dog",
      description: "Soft and tasty snacks made with real chicken meat. High-protein treat perfect for training or rewarding your dog.",
      longDescription: "JerHigh Dog Treats are made with real chicken meat as the primary ingredient. These soft, chewy treats are perfect for training sessions or as occasional rewards. High in protein and free from artificial preservatives.",
      image: "/src/assets/id3.jpg",
      hasVariants: false,
    
      brand: "JerHigh",
      sold: 2100,
      inStock: true
    },
    {
      id: 4,
      name: "CatCare Cat Food 1kg",
      category: "pet-food-treats",
      price: "₱279.00",
      basePrice: 279,
      petType: "cat",
      description: "Complete urinary health support for cats of all life stages. Original packaging ensures freshness and quality.",
      longDescription: "CatCare Urinary Health formula is specially designed to support urinary tract health in cats. Contains balanced minerals to maintain proper urine pH and prevent crystal formation. Suitable for cats of all ages.",
      image: "/src/assets/id4.jpg",
      hasVariants: false,
      
      brand: "CatCare",
      sold: 1500,
      inStock: true
    },
    {
      id: 5,
      name: "1KG Vitality Value Meal Adult",
      category: "pet-food-treats",
      price: "₱190.00",
      basePrice: 190,
      petType: "dog",
      description: "Complete and balanced adult dog food with essential vitamins and minerals for daily vitality.",
      longDescription: "Vitality Value Meal provides complete nutrition for adult dogs. Formulated with high-quality protein, essential vitamins, and minerals to support your dog's overall health and energy levels.",
      image: "/src/assets/id5.jpg",
      hasVariants: false,
    
      brand: "Vitality",
      sold: 3200,
      inStock: true
    },
    {
      id: 6,
      name: "Royal Canin Mini Puppy Wet Food 85g",
      category: "pet-food-treats",
      price: "₱79.00",
      basePrice: 79,
      petType: "dog",
      description: "Specialized wet food for small breed puppies aged 2-10 months. Supports healthy growth and development.",
      longDescription: "Royal Canin Mini Puppy formula is specifically designed for small breed puppies. Provides optimal nutrition for healthy growth, with the right balance of proteins, vitamins, and minerals for developing puppies.",
      image: "/src/assets/id6.jpg",
      hasVariants: false,

      brand: "Royal Canin",
      sold: 2800,
      inStock: true
    },
    {
      id: 7,
      name: "Prof Bengal Kind Kibble Dry Cat Food 400g",
      category: "pet-food-treats",
      price: "₱235.00",
      basePrice: 235,
      petType: "cat",
      description: "Premium dry cat food with chicken recipe, formulated for Bengal cats and active felines.",
      longDescription: "Prof Bengal Kind Kibble is specially formulated for Bengal cats and other active breeds. Made with real chicken as the first ingredient, this premium dry food supports lean muscle mass and provides sustained energy.",
      image: "/src/assets/id7.jpg",
      hasVariants: false,
    
      brand: "Prof",
      sold: 1100,
      inStock: true
    },
    {
      id: 8,
      name: "Petplus Doggie Biscuit 80g",
      category: "pet-food-treats",
      price: "₱95.00",
      basePrice: 95,
      petType: "dog",
      description: "Crunchy bone-shaped biscuits for dogs. Helps clean teeth while providing a tasty snack.",
      longDescription: "Petplus Doggie Biscuits are crunchy bone-shaped treats that help clean teeth as dogs chew. Made with natural ingredients, they're perfect for rewarding your dog while promoting dental health.",
      image: "/src/assets/id8.jpg",
      hasVariants: false,
      
      brand: "Petplus",
      sold: 1800,
      inStock: true
    },
    {
      id: 9,
      name: "Pedigree Wet Dog Food in Can 400g",
      category: "pet-food-treats",
      price: "₱155.00",
      basePrice: 155,
      petType: "dog",
      description: "Complete and balanced wet dog food in convenient canned format. Rich in protein and essential nutrients.",
      longDescription: "Pedigree wet dog food provides complete nutrition in a delicious canned format. Made with high-quality ingredients and fortified with essential vitamins and minerals for your dog's overall health.",
      image: "/src/assets/id9.jpg",
      hasVariants: true,
      variants: [
        { id: "puppy", flavor: "Puppy", price: 155.00 },
        { id: "chicken", flavor: "Chicken", price: 155.00 },
        { id: "beef", flavor: "Beef", price: 155.00 }
      ],

      brand: "Pedigree",
      sold: 4500,
      inStock: true
    },
    {
      id: 10,
      name: "Royal Canin British Shorthair Adult Wet Cat Food 85g",
      category: "pet-food-treats",
      price: "₱89.00",
      basePrice: 89,
      petType: "cat",
      description: "Specialized wet food for British Shorthair adult cats. Supports urinary health and maintains ideal weight.",
      longDescription: "Royal Canin British Shorthair formula is specially designed for the unique needs of British Shorthair cats. Supports urinary health, helps maintain ideal weight, and provides balanced nutrition.",
      image: "/src/assets/id10.jpg",
      hasVariants: false,

      brand: "Royal Canin",
      sold: 1900,
      inStock: true
    },

    // Pet Grooming Supplies (10 products)
    {
      id: 11,
      name: "Bayopet Anti Tick and Flea Dog Soap 90g",
      category: "pet-grooming-supplies",
      price: "₱119.00",
      basePrice: 119,
      petType: "dog",
      description: "Medicated soap for dogs that effectively eliminates ticks and fleas while cleaning and deodorizing.",
      longDescription: "Bayopet Anti Tick and Flea Soap is a medicated cleansing bar that helps eliminate ticks, fleas, and other parasites while cleaning and deodorizing your dog's coat. Gentle on skin yet effective against pests.",
      image: "/src/assets/id11.jpg",
      hasVariants: false,
    
      brand: "Bayopet",
      sold: 3200,
      inStock: true
    },
    {
      id: 12,
      name: "St. Roche Dog Conditioner 500ml",
      category: "pet-grooming-supplies",
      price: "₱408.00",
      basePrice: 408,
      petType: "dog",
      description: "Premium conditioner for dogs that softens fur, reduces tangles, and leaves a pleasant scent.",
      longDescription: "St. Roche Dog Conditioner helps detangle and soften your dog's coat, making grooming easier. Leaves fur smooth, shiny, and pleasantly scented. Formulated to be gentle on sensitive skin.",
      image: "/src/assets/id12.jpg",
      hasVariants: true,
      variants: [
        { id: "mother-nature", scent: "Mother Nature", price: 408.00 },
        { id: "happiness", scent: "Happiness", price: 408.00 },
        { id: "sweet-embrace", scent: "Sweet Embrace", price: 408.00 },
        { id: "heaven-scent", scent: "Heaven Scent", price: 408.00 }
      ],
 
      brand: "St. Roche",
      sold: 1500,
      inStock: true
    },
    {
      id: 13,
      name: "Doggies Care Pet Shampoo with Conditioner 1gallon",
      category: "pet-grooming-supplies",
      price: "₱349.00",
      basePrice: 349,
      petType: "dog",
      description: "Natural shampoo with madre de cacao and guava extract. Cleans, conditions, and detangles pet fur.",
      longDescription: "Doggies Care 2-in-1 Shampoo and Conditioner combines cleansing and conditioning in one step. Made with natural madre de cacao and guava extract to promote healthy skin and coat. Economical gallon size.",
      image: "/src/assets/id13.jpg",
      hasVariants: true,
      variants: [
        { id: "bubblegum", scent: "Bubblegum", price: 349.00 },
        { id: "lavender", scent: "Lavender", price: 349.00 },
        { id: "strawberry", scent: "Strawberry", price: 349.00 },
        { id: "vanilla", scent: "Vanilla", price: 349.00 }
      ],
    
      brand: "Doggies Care",
      sold: 2800,
      inStock: true
    },
    {
      id: 14,
      name: "Bearing Dog Shampoo",
      category: "pet-grooming-supplies",
      price: "₱158.00 - ₱268.00",
      priceRange: { min: 158, max: 268 },
      basePrice: 158,
      petType: "dog",
      description: "Anti-tick, flea, and odor eliminator shampoo for all dog types. Promotes healthy skin and coat.",
      longDescription: "Bearing Dog Shampoo is a multi-purpose formula that eliminates ticks and fleas while removing odors. Suitable for all dog types and coat conditions. Promotes healthy skin and leaves coat clean and fresh.",
      image: "/src/assets/id14.jpg",
      hasVariants: true,
      variants: [
        { id: "all-dogs-150ml", type: "For All Dogs", size: "150ml", price: 158.00 },
        { id: "smelly-hair-150ml", type: "Smelly Hair", size: "150ml", price: 158.00 },
        { id: "small-breeds-150ml", type: "For Small Breeds", size: "150ml", price: 158.00 },
        { id: "long-hair-150ml", type: "Long Hair", size: "150ml", price: 158.00 },
        { id: "all-dogs-300ml", type: "For All Dogs", size: "300ml", price: 268.00 },
        { id: "smelly-hair-300ml", type: "Smelly Hair", size: "300ml", price: 268.00 },
        { id: "small-breeds-300ml", type: "For Small Breeds", size: "300ml", price: 268.00 },
        { id: "long-hair-300ml", type: "Long Hair", size: "300ml", price: 268.00 }
      ],
 
      brand: "Bearing",
      sold: 4200,
      inStock: true
    },
    {
      id: 15,
      name: "Pet Single Grooming Stainless Dematting/Deshedding Comb",
      category: "pet-grooming-supplies",
      price: "₱69.00",
      basePrice: 69,
      petType: "all",
      description: "Stainless steel comb for removing mats, tangles, and loose fur from pets' coats.",
      longDescription: "This stainless steel grooming comb is designed to easily remove mats, tangles, and loose fur from your pet's coat. Durable construction with comfortable handle for easy grooming sessions.",
      image: "/src/assets/id15.jpg",
      hasVariants: true,
      variants: [
        { id: "blue", color: "Blue", price: 69.00 },
        { id: "red", color: "Red", price: 69.00 },
        { id: "green", color: "Green", price: 69.00 }
      ],
   
      brand: "Pet Grooming",
      sold: 3500,
      inStock: true
    },
    {
      id: 16,
      name: "Bioline Pet Toothpaste 100g",
      category: "pet-grooming-supplies",
      price: "₱89.00 - ₱95.00",
      priceRange: { min: 89, max: 95 },
      basePrice: 89,
      petType: "all",
      description: "Specialty toothpaste for pets that promotes dental health and fresh breath.",
      longDescription: "Bioline Pet Toothpaste is specially formulated for pets' dental care. Helps reduce plaque and tartar buildup while freshening breath. Available in flavors pets love.",
      image: "/src/assets/id16.jpg",
      hasVariants: true,
      variants: [
        { id: "beef", flavor: "Beef", petType: "dog", price: 95.00 },
        { id: "mint", flavor: "Mint", petType: "dog", price: 95.00 },
        { id: "orange", flavor: "Orange", petType: "dog", price: 95.00 },
        { id: "cheese-cat", flavor: "Cheese", petType: "cat", price: 89.00 },
        { id: "chicken", flavor: "Chicken", petType: "dog", price: 95.00 }
      ],
    
      brand: "Bioline",
      sold: 2100,
      inStock: true
    },
    {
      id: 17,
      name: "Eye Doctor Eye Drop Cleanser OTC",
      category: "pet-grooming-supplies",
      price: "₱85.00 - ₱199.00",
      priceRange: { min: 85, max: 199 },
      basePrice: 85,
      petType: "all",
      description: "Gentle eye drop cleanser for pets that removes dirt and discharge while soothing irritation.",
      longDescription: "Eye Doctor is a gentle eye drop cleanser that helps remove dirt, debris, and discharge from your pet's eyes. Soothes irritation and helps maintain eye health.",
      image: "/src/assets/id17.jpg",
      hasVariants: true,
      variants: [
        { id: "30ml", size: "30ml", price: 85.00 },
        { id: "120ml", size: "120ml", price: 199.00 }
      ],
     
      brand: "Playpets",
      sold: 1800,
      inStock: true
    },
    {
      id: 18,
      name: "Bearing Cat Shampoo 250ml",
      category: "pet-grooming-supplies",
      price: "₱250.00",
      basePrice: 250,
      petType: "cat",
      description: "Specialty shampoo formulated for cats with different coat and skin needs.",
      longDescription: "Bearing Cat Shampoo is specially formulated for feline skin and coat. Available in different formulas to address specific needs like shedding control, sensitive skin, or brightening.",
      image: "/src/assets/id18.jpg",
      hasVariants: true,
      variants: [
        { id: "shed-control", type: "Shed Control", price: 250.00 },
        { id: "dry-sensitive", type: "Dry & Sensitive Skin", price: 250.00 },
        { id: "miracle-brightening", type: "Miracle Brightening", price: 250.00 }
      ],
     
      brand: "Bearing",
      sold: 1500,
      inStock: true
    },
    {
      id: 19,
      name: "Pet Pedicure Electric Pet Nail Trimmer",
      category: "pet-grooming-supplies",
      price: "₱95.00",
      basePrice: 95,
      petType: "all",
      description: "Electric nail trimmer with extra filer for safe and easy pet nail grooming at home.",
      longDescription: "This electric nail trimmer makes pet nail grooming safe and easy. Includes an extra filer for smoothing edges. Quiet operation helps keep pets calm during grooming.",
      image: "/src/assets/id19.jpg",
      hasVariants: false,
  
      brand: "Pet Pedicure",
      sold: 3200,
      inStock: true
    },
    {
      id: 20,
      name: "Pampered Pooch Sweet Scent 260ml - Buy 1 Take 1",
      category: "pet-grooming-supplies",
      price: "₱249.00",
      basePrice: 249,
      petType: "dog",
      description: "Long-lasting fragrance spray for dogs. Buy one get one free offer leaves your pet smelling fresh.",
      longDescription: "Pampered Pooch Sweet Scent is a long-lasting fragrance spray that keeps your dog smelling fresh between baths. Current promotion offers buy one get one free for double value.",
      image: "/src/assets/id20.jpg",
      hasVariants: false,
      promotion: "Buy 1 Take 1",
    
      brand: "Pampered Pooch",
      sold: 2500,
      inStock: true
    },

    // Health & Wellness (10 products)
    {
      id: 21,
      name: "Dextrovet Pet Dextrose Powder 100g",
      category: "health-wellness",
      price: "₱65.00",
      basePrice: 65,
      petType: "all",
      description: "Energy supplement powder that provides quick glucose boost for weak, recovering, or stressed pets.",
      longDescription: "Dextrovet Pet Dextrose Powder provides quick energy boost for weak, recovering, or stressed pets. Easily mixed with water or food to support energy levels during recovery or stressful situations.",
      image: "/src/assets/id21.jpg",
      hasVariants: false,
    
      brand: "Dextrovet",
      sold: 1800,
      inStock: true
    },
    {
      id: 22,
      name: "Pawpy DOX50 Doxycycline Syrup 50mg (60ml)",
      category: "health-wellness",
      price: "₱289.00",
      basePrice: 289,
      petType: "all",
      description: "Over-the-counter antibiotic syrup for dogs and cats. Effective against various bacterial infections.",
      longDescription: "Pawpy DOX50 is an over-the-counter antibiotic syrup effective against various bacterial infections in dogs and cats. Always consult with a veterinarian for proper diagnosis and dosage.",
      image: "/src/assets/id22.jpg",
      hasVariants: false,
      note: "For Dogs & Cats",

      brand: "Pawpy",
      sold: 1200,
      inStock: true
    },
    {
      id: 23,
      name: "Top Of My Game Multivitamins 60ml",
      category: "health-wellness",
      price: "₱50.00",
      basePrice: 50,
      petType: "all",
      description: "Multivitamin supplement for dogs and cats ages 6 months to 5 years old. Supports overall health and vitality.",
      longDescription: "Top Of My Game Multivitamins provide essential vitamins and minerals for pets aged 6 months to 5 years. Supports overall health, immune function, and vitality. Currently on sale with extended expiry.",
      image: "/src/assets/id23.jpg",
      hasVariants: false,
      promotion: "SALE",
      expiry: "October 2027",
   
      brand: "Top Of My Game",
      sold: 3500,
      inStock: true
    },
    {
      id: 24,
      name: "LC Vit Plus for Cats/Kittens",
      category: "health-wellness",
      price: "₱135.00 - ₱185.00",
      priceRange: { min: 135, max: 185 },
      basePrice: 135,
      petType: "cat",
      description: "Vitamin supplement specially formulated for cats and kittens to support immune system and growth.",
      longDescription: "LC Vit Plus is specially formulated for cats and kittens. Provides essential vitamins to support immune system function, growth, and overall health. Available in different sizes.",
      image: "/src/assets/id24.jpg",
      hasVariants: true,
      variants: [
        { id: "60ml", size: "60ml", price: 135.00 },
        { id: "120ml", size: "120ml", price: 185.00 },
        { id: "160ml", size: "160ml", price: 185.00 }
      ],
    
      brand: "LC Vit",
      sold: 2200,
      inStock: true
    },
    {
      id: 25,
      name: "Alpha-Vit Multivitamins 120ml",
      category: "health-wellness",
      price: "₱239.00",
      basePrice: 239,
      petType: "all",
      description: "Complete multivitamin supplement for pets that promotes overall wellness and energy levels.",
      longDescription: "Alpha-Vit Multivitamins provide a complete range of essential vitamins and minerals for pets. Supports overall wellness, energy levels, and helps maintain optimal health.",
      image: "/src/assets/id25.jpg",
      hasVariants: false,
      
      brand: "Alpha-Vit",
      sold: 1900,
      inStock: true
    },
    {
      id: 26,
      name: "Broncho Aid 60ml",
      category: "health-wellness",
      price: "₱209.00",
      basePrice: 209,
      petType: "all",
      description: "Herbal supplement for cough and cold symptoms in dogs and cats. Natural relief for respiratory issues.",
      longDescription: "Broncho Aid is a herbal supplement that provides natural relief for cough and cold symptoms in dogs and cats. Helps soothe respiratory irritation and supports respiratory health.",
      image: "/src/assets/id26.jpg",
      hasVariants: false,
      note: "For cough & cold herbal supplement",
      
      brand: "Broncho Aid",
      sold: 1600,
      inStock: true
    },
    {
      id: 27,
      name: "Deltacal Chewable Calcium Pet Supplement Tablet",
      category: "health-wellness",
      price: "₱70.00 - ₱280.00",
      priceRange: { min: 70, max: 280 },
      basePrice: 70,
      petType: "all",
      description: "Chewable calcium tablets for strong bones and teeth. Supports skeletal health in growing and adult pets.",
      longDescription: "Deltacal Chewable Calcium Tablets provide essential calcium for strong bones and teeth. Particularly important for growing puppies/kittens, pregnant/nursing pets, and senior animals.",
      image: "/src/assets/id27.jpg",
      hasVariants: true,
      variants: [
        { id: "10-tablets", size: "10 tablets", price: 70.00 },
        { id: "50-tablets", size: "1 bottle (50 tablets)", price: 280.00 }
      ],

      brand: "Deltacal",
      sold: 2400,
      inStock: true
    },
    {
      id: 28,
      name: "Dr Shiba Anti Tick and Flea Spray for Dogs and Cats 250ml",
      category: "health-wellness",
      price: "₱339.00",
      basePrice: 339,
      petType: "all",
      description: "Veterinary-grade spray that effectively eliminates ticks, fleas, and prevents reinfestation.",
      longDescription: "Dr Shiba Anti Tick and Flea Spray is a veterinary-grade formula that effectively eliminates ticks and fleas on contact. Provides protection against reinfestation and is safe for both dogs and cats.",
      image: "/src/assets/id28.jpg",
      hasVariants: false,

      brand: "Dr Shiba",
      sold: 2800,
      inStock: true
    },
    {
      id: 29,
      name: "Vetcore Nature's Advance Tick and Flea Spray 250ml",
      category: "health-wellness",
      price: "₱349.00",
      basePrice: 349,
      petType: "all",
      description: "Advanced formula tick and flea spray with natural ingredients. Provides long-lasting protection.",
      longDescription: "Vetcore Nature's Advance Tick and Flea Spray uses an advanced formula with natural ingredients to provide effective and long-lasting protection against ticks and fleas. Safe for regular use.",
      image: "/src/assets/id29.jpg",
      hasVariants: false,
      
      brand: "Vetcore",
      sold: 2100,
      inStock: true
    },
    {
      id: 30,
      name: "NEW Petsmed Dextrose Powder 100g",
      category: "health-wellness",
      price: "₱57.00",
      basePrice: 57,
      petType: "all",
      description: "New formula dextrose powder for quick energy recovery in weak, dehydrated, or convalescing pets.",
      longDescription: "NEW Petsmed Dextrose Powder is an improved formula that provides quick energy recovery for weak, dehydrated, or convalescing pets. Easily administered by mixing with water or food.",
      image: "/src/assets/id30.jpg",
      hasVariants: false,
      
      brand: "Petsmed",
      sold: 1500,
      inStock: true
    },

    // Litter & Toilet (10 products)
    {
      id: 31,
      name: "Dono Disposable Male Belly Wrap Male Diaper 1pc",
      category: "litter-toilet",
      price: "₱15.00 - ₱30.00",
      priceRange: { min: 15, max: 30 },
      basePrice: 15,
      petType: "dog",
      description: "Disposable belly wrap diaper for male dogs. Ideal for incontinence, marking, or post-surgery care.",
      longDescription: "Dono Disposable Male Belly Wraps are designed for male dogs experiencing incontinence, marking behavior, or requiring post-surgical care. Disposable and convenient for temporary use.",
      image: "/src/assets/id31.jpg",
      hasVariants: true,
      variants: [
        { id: "xs", size: "XS", price: 15.00 },
        { id: "s", size: "S", price: 20.00 },
        { id: "m", size: "M", price: 25.00 },
        { id: "l", size: "L", price: 30.00 }
      ],

      brand: "Dono",
      sold: 3200,
      inStock: true
    },
    {
      id: 32,
      name: "Purreetty Cat Litter Sand",
      category: "litter-toilet",
      price: "₱65.00 - ₱165.00",
      priceRange: { min: 65, max: 165 },
      basePrice: 65,
      petType: "cat",
      description: "Clumping cat litter sand with pleasant scents. Controls odor and makes cleaning easy.",
      longDescription: "Purreetty Cat Litter Sand features excellent clumping ability with pleasant scents. Effectively controls odor and makes litter box maintenance easy. Available in different sizes and scents.",
      image: "/src/assets/id32.jpg",
      hasVariants: true,
      variants: [
        { id: "1kg-lemon", size: "1kg", scent: "Lemon", price: 65.00 },
        { id: "1kg-lavender", size: "1kg", scent: "Lavender", price: 65.00 },
        { id: "5l-lemon", size: "5L", scent: "Lemon", price: 165.00 },
        { id: "5l-lavender", size: "5L", scent: "Lavender", price: 165.00 }
      ],

      brand: "Purreetty",
      sold: 4500,
      inStock: true
    },
    {
      id: 33,
      name: "Cattitude Cat Litter Sand 10L",
      category: "litter-toilet",
      price: "₱259.00 - ₱275.00",
      priceRange: { min: 259, max: 275 },
      basePrice: 259,
      petType: "cat",
      description: "Premium clumping cat litter with various scents. Excellent odor control and low dust formula.",
      longDescription: "Cattitude Cat Litter Sand is a premium clumping litter with excellent odor control properties. Low dust formula is better for both cats and owners. Available in various appealing scents.",
      image: "/src/assets/id33.jpg",
      hasVariants: true,
      variants: [
        { id: "apple", scent: "Apple", price: 259.00 },
        { id: "mango", scent: "Mango", price: 259.00 },
        { id: "coffee", scent: "Coffee", price: 259.00 },
        { id: "lavender", scent: "Lavender", price: 259.00 },
        { id: "lemon", scent: "Lemon", price: 259.00 },
        { id: "strawberry", scent: "Strawberry", price: 275.00 }
      ],

      brand: "Cattitude",
      sold: 3800,
      inStock: true
    },
    {
      id: 34,
      name: "Bioline Potty Puppy Training Spray 50ml",
      category: "litter-toilet",
      price: "₱129.00",
      basePrice: 129,
      petType: "dog",
      description: "Training spray that attracts puppies to designated potty areas. Speeds up housebreaking process.",
      longDescription: "Bioline Potty Puppy Training Spray contains attractants that encourage puppies to use designated potty areas. Helps speed up the housebreaking process and establish good bathroom habits.",
      image: "/src/assets/id34.jpg",
      hasVariants: false,
    
      brand: "Bioline",
      sold: 2100,
      inStock: true
    },
    {
      id: 35,
      name: "Pet Washable Diaper (Female) Random Design",
      category: "litter-toilet",
      price: "₱119.00",
      basePrice: 119,
      petType: "dog",
      description: "Reusable washable diaper for female pets. Comes in random cute designs with adjustable fit.",
      longDescription: "These washable diapers for female pets feature cute random designs and adjustable fit for comfort. Reusable and eco-friendly alternative to disposable diapers. Machine washable for easy cleaning.",
      image: "/src/assets/id35.jpg",
      hasVariants: true,
      variants: [
        { id: "xs", size: "XS", price: 119.00 },
        { id: "s", size: "S", price: 119.00 },
        { id: "m", size: "M", price: 119.00 },
        { id: "l", size: "L", price: 119.00 },
        { id: "xl", size: "XL", price: 119.00 }
      ],
    
      brand: "Pet Comfort",
      sold: 2800,
      inStock: true
    },
    {
      id: 36,
      name: "Warrior Scented Premium Cat Litter Sand 10L",
      category: "litter-toilet",
      price: "₱289.00",
      basePrice: 289,
      petType: "cat",
      description: "Premium scented cat litter with superior clumping and odor neutralizing properties.",
      longDescription: "Warrior Scented Premium Cat Litter offers superior clumping performance and excellent odor neutralization. Premium quality with various scent options to keep the litter box area fresh.",
      image: "/src/assets/id36.jpg",
      hasVariants: true,
      variants: [
        { id: "lavender", scent: "Lavender", price: 289.00 },
        { id: "lemon", scent: "Lemon", price: 289.00 },
        { id: "forest", scent: "Forest", price: 289.00 },
        { id: "blueberry", scent: "Blueberry", price: 289.00 },
        { id: "apple", scent: "Apple", price: 289.00 }
      ],
  
      brand: "Warrior",
      sold: 3200,
      inStock: true
    },
    {
      id: 37,
      name: "Disposable Pet Blue Pad",
      category: "litter-toilet",
      price: "₱6.00 - ₱9.00",
      priceRange: { min: 6, max: 9 },
      basePrice: 6,
      petType: "all",
      description: "Disposable absorbent pads for training, elderly pets, or post-surgical care. Quick-dry top layer.",
      longDescription: "Disposable Pet Blue Pads feature a quick-dry top layer and super absorbent core. Ideal for puppy training, elderly pets with incontinence, or post-surgical care. Available in different sizes.",
      image: "/src/assets/id37.jpg",
      hasVariants: true,
      variants: [
        { id: "s", size: "S", price: 6.00 },
        { id: "m", size: "M", price: 9.00 }
      ],
      brand: "Pet Care",
      sold: 6500,
      inStock: true
    },
    {
      id: 38,
      name: "Pet Belly Band (Washable Diaper for Male)",
      category: "litter-toilet",
      price: "₱120.00",
      basePrice: 120,
      petType: "dog",
      description: "Reusable belly band for male dogs. Adjustable and washable, ideal for marking or incontinence.",
      longDescription: "Pet Belly Bands are reusable washable diapers designed specifically for male dogs. Adjustable fit ensures comfort and effectiveness for marking behavior or incontinence issues.",
      image: "/src/assets/id38.jpg",
      hasVariants: true,
      variants: [
        { id: "xs", size: "XS", price: 120.00 },
        { id: "s", size: "S", price: 120.00 },
        { id: "m", size: "M", price: 120.00 },
        { id: "l", size: "L", price: 120.00 }
      ],

      brand: "Pet Comfort",
      sold: 1900,
      inStock: true
    },
    {
      id: 39,
      name: "Pet Poop Garbage Bag with Paw Print",
      category: "litter-toilet",
      price: "₱12.00",
      basePrice: 12,
      petType: "all",
      description: "Biodegradable poop bags with cute paw print design. Eco-friendly and leak-proof for clean disposal.",
      longDescription: "These biodegradable poop bags feature cute paw print designs and are leak-proof for clean waste disposal. Eco-friendly option for responsible pet owners who clean up after their pets.",
      image: "/src/assets/id39.jpg",
      hasVariants: false,
    
      brand: "Pet Clean",
      sold: 8500,
      inStock: true
    },
    {
      id: 40,
      name: "Wizpoop 30ml Organic Odor Eliminator/Disinfectant/Poop Dryer",
      category: "litter-toilet",
      price: "₱65.00",
      basePrice: 65,
      petType: "all",
      description: "Triple-action formula that eliminates odors, disinfects surfaces, and dries pet waste quickly.",
      longDescription: "Wizpoop is a triple-action formula that eliminates odors, disinfects surfaces, and helps dry pet waste quickly. Organic formula is safe for use around pets while effectively managing waste odors.",
      image: "/src/assets/id40.jpg",
      hasVariants: false,
    
      brand: "Wizpoop",
      sold: 2800,
      inStock: true
    },

    // Pet Accessories & Toys (10 products)
    {
      id: 41,
      name: "Squeaky Flat Bone Toy with Paws and Bones Design",
      category: "pet-accessories-toys",
      price: "₱45.00",
      basePrice: 45,
      petType: "dog",
      description: "Fun squeaky bone-shaped toy with paw and bone prints. Durable and entertaining for playtime.",
      longDescription: "This flat bone-shaped toy features fun paw and bone prints with an internal squeaker for added entertainment. Durable construction withstands regular play while providing mental stimulation.",
      image: "/src/assets/id41.jpg",
      hasVariants: false,

      brand: "Pet Play",
      sold: 3200,
      inStock: true
    },
    {
      id: 42,
      name: "Pet Toy Braided Rope 17cm",
      category: "pet-accessories-toys",
      price: "₱25.00",
      basePrice: 25,
      petType: "dog",
      description: "Braided rope toy for tug-of-war and dental cleaning. Random colors available for durable play.",
      longDescription: "Braided rope toys are perfect for tug-of-war games and help clean your dog's teeth during play. Durable construction with random color availability. Great for interactive play with your dog.",
      image: "/src/assets/id42.jpg",
      hasVariants: false,
      note: "Random color only",
  
      brand: "Pet Play",
      sold: 4500,
      inStock: true
    },
    {
      id: 43,
      name: "Yellow Chix Squeaky Pet Toy 17cm",
      category: "pet-accessories-toys",
      price: "₱55.00",
      basePrice: 55,
      petType: "dog",
      description: "Bright yellow chicken-shaped squeaky toy. Perfect for fetch and interactive play sessions.",
      longDescription: "This bright yellow chicken-shaped squeaky toy is perfect for fetch and interactive play sessions. The squeaker inside adds excitement to playtime, encouraging your dog to engage with the toy.",
      image: "/src/assets/id43.jpg",
      hasVariants: false,

      brand: "Pet Play",
      sold: 2800,
      inStock: true
    },
    {
      id: 44,
      name: "Cat Spiral Tower Toy with Free Balls",
      category: "pet-accessories-toys",
      price: "₱149.00",
      basePrice: 149,
      petType: "cat",
      description: "Interactive spiral tower with balls for cats to bat and chase. Stimulates natural hunting instincts.",
      longDescription: "This spiral tower toy comes with free balls that cats can bat and chase through the spiral track. Stimulates natural hunting instincts and provides hours of entertainment for indoor cats.",
      image: "/src/assets/id44.jpg",
      hasVariants: false,

      brand: "Cat Enrichment",
      sold: 1900,
      inStock: true
    },
    {
      id: 45,
      name: "3-in-1 Rubber Pet Ball Toy",
      category: "pet-accessories-toys",
      price: "₱69.00",
      basePrice: 69,
      petType: "dog",
      description: "Multi-functional rubber ball toy that bounces, floats, and can hold treats for extended play.",
      longDescription: "This 3-in-1 rubber ball toy bounces for fetch games, floats for water play, and can be filled with treats for extended engagement. Durable rubber construction withstands aggressive chewers.",
      image: "/src/assets/id45.jpg",
      hasVariants: false,
  
      brand: "Pet Play",
      sold: 3200,
      inStock: true
    },
    {
      id: 46,
      name: "Candy Colored Pet Plastic Bowl 12.5x5cm",
      category: "pet-accessories-toys",
      price: "₱25.00",
      basePrice: 25,
      petType: "all",
      description: "Vibrant plastic feeding bowl in candy colors. Perfect for small pets or as a treat dish.",
      longDescription: "These vibrant candy-colored plastic bowls are perfect for small pets or as treat dishes. Easy to clean and available in various bright colors to match your pet's personality.",
      image: "/src/assets/id46.jpg",
      hasVariants: true,
      variants: [
        { id: "blue", color: "Blue", price: 25.00 },
        { id: "green", color: "Green", price: 25.00 },
        { id: "pink", color: "Pink", price: 25.00 }
      ],
      
      brand: "Pet Essentials",
      sold: 5200,
      inStock: true
    },
    {
      id: 47,
      name: "Rainbow Round Pet Harness and Leash Set (Small)",
      category: "pet-accessories-toys",
      price: "₱95.00",
      basePrice: 95,
      petType: "dog",
      description: "Colorful rainbow-pattern harness and leash set for small dogs. Comfortable and secure fit.",
      longDescription: "This rainbow-pattern harness and leash set is designed for small dogs. Provides comfortable and secure fit for walks while adding a colorful style element to your pet's accessories.",
      image: "/src/assets/id47.jpg",
      hasVariants: false,

      brand: "Pet Fashion",
      sold: 2100,
      inStock: true
    },
    {
      id: 48,
      name: "Pet Sunglass / Eyeglass",
      category: "pet-accessories-toys",
      price: "₱59.00",
      basePrice: 59,
      petType: "dog",
      description: "Stylish sunglasses for pets with UV protection. Perfect for photos or sunny outdoor adventures.",
      longDescription: "These stylish pet sunglasses offer UV protection and come in various colors. Perfect for sunny outdoor adventures or fun photo sessions. Currently on sale at a discounted price.",
      image: "/src/assets/id48.jpg",
      hasVariants: true,
      promotion: "SALE",
      variants: [
        { id: "pink", color: "Pink", price: 59.00 },
        { id: "black", color: "Black", price: 59.00 },
        { id: "violet", color: "Violet", price: 59.00 },
        { id: "clear", color: "Clear", price: 59.00 },
        { id: "red", color: "Red", price: 59.00 },
        { id: "yellow", color: "Yellow", price: 59.00 }
      ],

      brand: "Pet Fashion",
      sold: 1800,
      inStock: true
    },
    {
      id: 49,
      name: "Pet Foldable Tent Playpen",
      category: "pet-accessories-toys",
      price: "₱550.00",
      basePrice: 550,
      petType: "all",
      description: "Portable foldable tent playpen for pets. Great for travel, containment, or creating a safe play area.",
      longDescription: "This foldable tent playpen is portable and easy to set up. Perfect for travel, temporary containment, or creating a safe play area for your pet indoors or outdoors. Available in different colors.",
      image: "/src/assets/id49.jpg",
      hasVariants: true,
      variants: [
        { id: "brown", color: "Brown", price: 550.00 },
        { id: "red", color: "Red", price: 550.00 },
        { id: "gray", color: "Gray", price: 550.00 }
      ],

      brand: "Pet Home",
      sold: 1200,
      inStock: true
    },
    {
      id: 50,
      name: "Single Pet Collar Rainbow 2.0",
      category: "pet-accessories-toys",
      price: "₱49.00",
      basePrice: 49,
      petType: "all",
      description: "Colorful rainbow-pattern adjustable collar with secure buckle. Stylish and functional for daily wear.",
      longDescription: "Rainbow 2.0 pet collar features a vibrant rainbow pattern with adjustable fit and secure buckle. Both stylish and functional for daily wear, adding a pop of color to your pet's look.",
      image: "/src/assets/id50.jpg",
      hasVariants: false,
    
      brand: "Pet Fashion",
      sold: 3800,
      inStock: true
    }
  ];

  const [catalogProducts, setCatalogProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');

  const categories = [
    { id: 'all', name: 'View All' },
    { id: 'pet-food-treats', name: 'Pet Food & Treats' },
    { id: 'pet-grooming-supplies', name: 'Pet Grooming Supplies' },
    { id: 'health-wellness', name: 'Health & Wellness' },
    { id: 'litter-toilet', name: 'Litter & Toilet' },
    { id: 'pet-accessories-toys', name: 'Pet Accessories & Toys' }
  ];

  useEffect(() => {
    let active = true;

    const loadCatalog = async () => {
      setCatalogLoading(true);
      setCatalogError('');

      try {
        const nextProducts = await fetchCatalogProducts('Pet Shop');
        if (!active) return;
        setCatalogProducts(nextProducts);
      } catch (_error) {
        if (!active) return;
        setCatalogProducts([]);
        setCatalogError('Hindi namin ma-load ang latest Pet Shop items ngayon. Pakisubukan ulit maya-maya.');
      } finally {
        if (active) {
          setCatalogLoading(false);
        }
      }
    };

    loadCatalog();

    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') {
        void loadCatalog();
      }
    };
    const poller = window.setInterval(() => {
      void loadCatalog();
    }, 120000);
    document.addEventListener('visibilitychange', refreshOnFocus);

    return () => {
      active = false;
      window.clearInterval(poller);
      document.removeEventListener('visibilitychange', refreshOnFocus);
    };
  }, []);

  useEffect(() => {
    let filtered = [...catalogProducts];
    
    // Apply category filter
    if (category && category !== 'all') {
      filtered = filtered.filter(product => product.category === category);
    }
    
    // Apply pet type filter
    if (selectedPetType !== 'all') {
      filtered = filtered.filter(product => product.petType === selectedPetType || product.petType === 'all');
    }
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort products
    if (sortBy === 'price-low') {
      filtered.sort((a, b) => a.basePrice - b.basePrice);
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => b.basePrice - a.basePrice);
    }
    
    setProducts(filtered);
  }, [category, sortBy, searchTerm, selectedPetType, catalogProducts]);

  const handleCategoryClick = (catId) => {
    navigate(`/shop/${catId}`);
  };

  const handleQuickView = (product) => {
    setQuickViewProduct(product);
    setQuantity(1);
    if (product.variants && product.variants.length > 0) {
      setSelectedVariant({ [product.id]: product.variants[0].id });
    }
  };

  const handleQuantityChange = (change) => {
    const maxQuantity = Math.max(1, Number(quickViewProduct?.stock || 1));
    setQuantity(prev => Math.max(1, Math.min(maxQuantity, prev + change)));
  };

  const handleQuickViewAddToCart = () => {
    if (quickViewProduct) {
      const selectedVariantId = selectedVariant[quickViewProduct.id];
      addToCart(quickViewProduct, selectedVariantId, quantity);
      setQuickViewProduct(null);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleVariantSelect = (productId, variantId) => {
    setSelectedVariant(prev => ({
      ...prev,
      [productId]: variantId
    }));
  };

  const getSelectedVariantPrice = (product) => {
    if (!product.variants || product.variants.length === 0) {
      return product.basePrice;
    }
    const selectedId = selectedVariant[product.id] || product.variants[0].id;
    const variant = product.variants.find(v => v.id === selectedId);
    return variant ? variant.price : product.basePrice;
  };

  const getSelectedVariantName = (product) => {
    if (!product.variants || product.variants.length === 0) {
      return 'Standard';
    }
    const selectedId = selectedVariant[product.id] || product.variants[0].id;
    const variant = product.variants.find(v => v.id === selectedId);
    return variant ? variant.flavor || variant.scent || variant.type || variant.color || variant.size : 'Standard';
  };

  const getDisplayPrice = (product) => {
    if (product.price) {
      return product.price;
    }
    if (product.variants && product.variants.length > 0) {
      const minPrice = Math.min(...product.variants.map(v => v.price));
      const maxPrice = Math.max(...product.variants.map(v => v.price));
      if (minPrice === maxPrice) {
        return `₱${minPrice.toFixed(2)}`;
      }
      return `₱${minPrice.toFixed(2)} - ₱${maxPrice.toFixed(2)}`;
    }
    return `₱${product.basePrice.toFixed(2)}`;
  };

  return (
    <div className="happy-tails-shop">
      <Container className="happy-tails-shop-container">
        {/* Cart Floating Button */}
        <Button 
          className="happy-tails-cart-btn" 
          onClick={() => setCartVisible(true)}
        >
          <i className="fas fa-shopping-cart"></i> Cart ({getCartCount()})
        </Button>

        {/* Toast Notification */}
        <div className="happy-tails-toast-wrapper">
          <ToastContainer position="top-center" className="happy-tails-toast-container">
            <Toast 
              show={showToast} 
              onClose={() => setShowToast(false)} 
              delay={3000} 
              autohide
              className="happy-tails-toast"
            >
              <Toast.Header className="happy-tails-toast-header">
                <strong className="me-auto">Success</strong>
              </Toast.Header>
              <Toast.Body className="happy-tails-toast-body">
                {toastMessage}
              </Toast.Body>
            </Toast>
          </ToastContainer>
        </div>

        {/* Shop Header */}
        <div className="happy-tails-shop-header">
          <div className="happy-tails-logo-container">
            <img 
              src="/src/assets/logo.png" 
              alt="HappyTails Logo" 
              className="happy-tails-logo"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/200x80/fff2fa/f53799?text=HappyTails+Shop";
              }}
            />
          </div>
        </div>

        {/* Categories - FIXED BUTTON SIZES */}
        <div className="happy-tails-categories-container">
          <h2 className="happy-tails-categories-title">Shop by Category</h2>
          <div className="happy-tails-categories">
            {categories.map(cat => (
              <Button
                key={cat.id}
                className={`happy-tails-category-btn ${(!category && cat.id === 'all') || category === cat.id ? 'active' : ''}`}
                onClick={() => handleCategoryClick(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Search and Sort Container */}
        <div className="happy-tails-search-sort-container">
          <div className="happy-tails-search-wrapper">
            <Form.Control
              type="text"
              placeholder="Search products..."
              className="happy-tails-search-bar"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm && (
              <Button 
                variant="link" 
                className="happy-tails-clear-search"
                onClick={clearSearch}
              >
                Clear
              </Button>
            )}
          </div>
          
          <div className="happy-tails-sort-wrapper">
            <Form.Select
              className="happy-tails-sort-select"
              value={selectedPetType}
              onChange={(e) => setSelectedPetType(e.target.value)}
            >
              <option value="all">Filter by</option>
              <option value="dog">Dogs</option>
              <option value="cat">Cats</option>
            </Form.Select>
          </div>

          <div className="happy-tails-sort-wrapper">
            <Form.Select 
              className="happy-tails-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="default">Sort by</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </Form.Select>
          </div>
        </div>

        {/* Search Results Count */}
        {catalogError && (
          <div className="happy-tails-no-results">
            <p>{catalogError}</p>
          </div>
        )}

        {searchTerm && !catalogLoading && (
          <div className="happy-tails-search-results">
            <p className="happy-tails-search-count">
              Found {products.length} product{products.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Products Grid */}
        <Row className="happy-tails-products-grid justify-content-center">
          {catalogLoading ? (
            <div className="happy-tails-no-results">
              <p>Loading Pet Shop items...</p>
            </div>
          ) : products.length > 0 ? (
            products.map(product => {
              const displayPrice = getDisplayPrice(product);
              const variantName = getSelectedVariantName(product);
              const isOutOfStock = Number(product.stock || 0) <= 0;
              
              return (
                <Col key={product.id} md={3} sm={6} className="happy-tails-product-col d-flex justify-content-center">
                  <Card className="happy-tails-product-card">
                    <div className="happy-tails-product-image">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="happy-tails-product-img"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/300x200/ffe6f2/f53799?text=Product+Image";
                        }}
                      />
                      <div className="happy-tails-product-tags">
                        {product.tags && product.tags.map((tag, index) => (
                          <Badge key={index} bg="danger" className="happy-tails-product-tag">
                            {tag}
                          </Badge>
                        ))}
                        {product.promotion && (
                          <Badge bg="success" className="happy-tails-product-tag">
                            {product.promotion}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Card.Body className="happy-tails-product-body">
                      <div className="happy-tails-product-badge">
                        <Badge bg={product.petType === 'dog' ? 'primary' : 
                                   product.petType === 'cat' ? 'warning' : 'success'}>
                          {product.petType === 'all' ? 'All Pets' : product.petType}
                        </Badge>
                      </div>
                      <h5 className="happy-tails-product-name">{product.name}</h5>
                      
                      {/* Variant Selector */}
                      {product.variants && product.variants.length > 0 && (
                        <div className="happy-tails-variant-selector">
                          <Dropdown className="happy-tails-variant-dropdown">
                            <Dropdown.Toggle variant="outline" className="happy-tails-variant-toggle">
                              {variantName}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              {product.variants.map(variant => (
                                <Dropdown.Item 
                                  key={variant.id}
                                  onClick={() => handleVariantSelect(product.id, variant.id)}
                                  className={selectedVariant[product.id] === variant.id ? 'active' : ''}
                                >
                                  {variant.flavor || variant.scent || variant.type || variant.color || variant.size} - {formatCurrency(variant.price)}
                                </Dropdown.Item>
                              ))}
                            </Dropdown.Menu>
                          </Dropdown>
                        </div>
                      )}
                      
                      <p className="happy-tails-product-price">{displayPrice}</p>
                      
                      {/* Sold Count */}
                      <div className="happy-tails-sold-count">
                        <i className="fas fa-fire"></i> {product.sold.toLocaleString()} sold
                      </div>
                      
                      <div className="happy-tails-product-buttons">
                        <Button 
                          className="happy-tails-add-cart-btn"
                          disabled={isOutOfStock}
                          onClick={() => addToCart(product, selectedVariant[product.id])}
                        >
                          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                        </Button>
                        <Button 
                          variant="outline"
                          className="happy-tails-quick-view-btn"
                          onClick={() => handleQuickView(product)}
                        >
                          Quick View
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })
          ) : (
            <div className="happy-tails-no-results">
              <p>No products found. Try a different search or category.</p>
            </div>
          )}
        </Row>

        {/* Quick View Modal */}
        <Modal 
          show={!!quickViewProduct} 
          onHide={() => setQuickViewProduct(null)}
          className="happy-tails-quick-view-modal"
          size="xl"
          dialogClassName="happy-tails-quick-view-dialog"
        >
          {quickViewProduct && (
            <>
              <Modal.Header closeButton className="happy-tails-modal-header">
                <Modal.Title>{quickViewProduct.name}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div className="happy-tails-quick-view-content">
                  <div className="happy-tails-quick-view-image">
                    <img 
                      src={quickViewProduct.image} 
                      alt={quickViewProduct.name}
                      className="happy-tails-quick-view-img"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/400x300/ffe6f2/f53799?text=Product+Image";
                      }}
                    />
                  </div>
                  <div className="happy-tails-quick-view-details">
                    {Number(quickViewProduct.stock || 0) <= 0 && (
                      <div className="happy-tails-out-of-stock-badge">Out of Stock</div>
                    )}
                    <div className="happy-tails-quick-view-header">
                      <h3>{quickViewProduct.name}</h3>
                      <div className="happy-tails-quick-view-sold">
                        <i className="fas fa-fire"></i> {quickViewProduct.sold.toLocaleString()} sold
                      </div>
                    </div>
                    
                    {/* Variant Selector in Quick View */}
                    {quickViewProduct.variants && quickViewProduct.variants.length > 0 && (
                      <div className="happy-tails-quick-view-variants">
                        <h5>Select Variant:</h5>
                        <div className="happy-tails-variant-buttons">
                          {quickViewProduct.variants.map(variant => (
                            <Button
                              key={variant.id}
                              className={`happy-tails-variant-btn ${selectedVariant[quickViewProduct.id] === variant.id ? 'active' : ''}`}
                              onClick={() => handleVariantSelect(quickViewProduct.id, variant.id)}
                            >
                              {variant.flavor || variant.scent || variant.type || variant.color || variant.size}
                              <br />
                              <span className="happy-tails-variant-price">{formatCurrency(variant.price)}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Product Details Tabs */}
                    <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
                      <Nav variant="tabs" className="happy-tails-detail-tabs">
                        <Nav.Item>
                          <Nav.Link eventKey="description">Description</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link eventKey="details">Product Details</Nav.Link>
                        </Nav.Item>
                      </Nav>
                      <Tab.Content className="happy-tails-tab-content">
                        <Tab.Pane eventKey="description">
                          <p className="happy-tails-quick-view-description">
                            {quickViewProduct.longDescription}
                          </p>
                        </Tab.Pane>
                        <Tab.Pane eventKey="details">
                          <div className="happy-tails-quick-view-info">
                            <p><strong>For:</strong> {quickViewProduct.petType === 'all' ? 'All Pets' : quickViewProduct.petType}</p>
                            <p><strong>Category:</strong> {categories.find(c => c.id === quickViewProduct.category)?.name}</p>
                            <p><strong>Brand:</strong> {quickViewProduct.brand}</p>
                            {quickViewProduct.note && <p><strong>Note:</strong> {quickViewProduct.note}</p>}
                            {quickViewProduct.expiry && <p><strong>Expiry:</strong> {quickViewProduct.expiry}</p>}
                          </div>
                        </Tab.Pane>
                      </Tab.Content>
                    </Tab.Container>
                    
                    {/* Price and Quantity */}
                    <div className="happy-tails-quick-view-price-quantity">
                      <div className="happy-tails-quick-view-price">
                        <h4>{getDisplayPrice(quickViewProduct)}</h4>
                        {quickViewProduct.variants && quickViewProduct.variants.length > 0 && (
                          <p className="happy-tails-selected-variant">
                            Selected: {getSelectedVariantName(quickViewProduct)}
                          </p>
                        )}
                      </div>
                      <div className="happy-tails-quick-view-quantity">
                        <p>Quantity:</p>
                        <div className="happy-tails-quantity-controls">
                          <Button 
                            className="happy-tails-quantity-btn"
                            onClick={() => handleQuantityChange(-1)}
                          >
                            -
                          </Button>
                          <span className="happy-tails-quantity-value">{quantity}</span>
                          <Button 
                            className="happy-tails-quantity-btn"
                            onClick={() => handleQuantityChange(1)}
                            disabled={quantity >= Math.max(1, Number(quickViewProduct.stock || 1)) || Number(quickViewProduct.stock || 0) <= 0}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer className="happy-tails-modal-footer">
                <Button 
                  variant="secondary" 
                  onClick={() => setQuickViewProduct(null)}
                  className="happy-tails-close-btn"
                >
                  Close
                </Button>
                <Button 
                  className="happy-tails-modal-add-cart"
                  onClick={handleQuickViewAddToCart}
                  disabled={Number(quickViewProduct.stock || 0) <= 0}
                >
                  {Number(quickViewProduct.stock || 0) <= 0
                    ? 'Out of Stock'
                    : `Add to Cart (${formatCurrency(getSelectedVariantPrice(quickViewProduct) * quantity)})`}
                </Button>
              </Modal.Footer>
            </>
          )}
        </Modal>

        {/* Cart Sidebar */}
        <Modal 
          show={cartVisible} 
          onHide={() => setCartVisible(false)}
          dialogClassName="happy-tails-cart-modal"
        >
          <Modal.Header closeButton className="happy-tails-cart-header">
            <Modal.Title>
              <i className="fas fa-shopping-cart"></i> Your Cart ({getCartCount()})
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="happy-tails-cart-body">
            {cart.length === 0 ? (
              <div className="happy-tails-empty-cart">
                <div className="happy-tails-empty-cart-icon">
                  <i className="fas fa-shopping-cart"></i>
                </div>
                <p>Your cart is empty</p>
                <Button 
                  className="happy-tails-start-shopping"
                  onClick={() => {
                    setCartVisible(false);
                    navigate('/shop');
                  }}
                >
                  Start Shopping
                </Button>
              </div>
            ) : (
              <>
                {cart.map(item => (
                  <div key={`${item.id}-${item.variantId}`} className="happy-tails-cart-item">
                    <div className="happy-tails-cart-item-image">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="happy-tails-cart-item-img"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/80x80/ffe6f2/f53799?text=Product";
                        }}
                      />
                    </div>
                    <div className="happy-tails-cart-item-details">
                      <h6>{item.name}</h6>
                      {item.variantName && item.variantName !== 'Standard' && (
                        <p className="happy-tails-cart-variant">{item.variantName}</p>
                      )}
                      <p className="happy-tails-cart-item-price">
                        {formatCurrency(item.price)} each
                      </p>
                      <div className="happy-tails-cart-quantity">
                        <Button 
                          className="happy-tails-cart-quantity-btn"
                          onClick={() => updateQuantity(item.id, item.variantId, -1)}
                        >
                          -
                        </Button>
                        <span className="happy-tails-cart-quantity-value">{item.quantity}</span>
                        <Button 
                          className="happy-tails-cart-quantity-btn"
                          onClick={() => updateQuantity(item.id, item.variantId, 1)}
                          disabled={Number(item.quantity || 0) >= Number(item.stock || 0)}
                        >
                          +
                        </Button>
                      </div>
                      <p className="happy-tails-cart-item-total">
                        Item Total: {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                    <div className="happy-tails-cart-item-actions">
                      <Button 
                        variant="danger"
                        size="sm"
                        className="happy-tails-remove-item-btn"
                        onClick={() => removeFromCart(item.id, item.variantId)}
                      >
                        Remove
                      </Button>
                      <Button 
                        variant="link"
                        className="happy-tails-remove-item-icon"
                        onClick={() => removeFromCart(item.id, item.variantId)}
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="happy-tails-cart-total-section">
                  <div className="happy-tails-cart-fulfillment-box">
                    <p className="happy-tails-cart-fulfillment-title">Fulfillment Method</p>
                    <div className="happy-tails-cart-fulfillment-options">
                      <Form.Check
                        type="radio"
                        id="shop-pickup-option"
                        name="shopFulfillmentMethod"
                        label="Store Pickup"
                        checked={checkoutPreferences.fulfillmentMethod === 'pickup'}
                        onChange={() =>
                          updateCheckoutPreferences({
                            fulfillmentMethod: 'pickup',
                            shippingOption: ''
                          })
                        }
                      />
                      <Form.Check
                        type="radio"
                        id="shop-delivery-option"
                        name="shopFulfillmentMethod"
                        label="Delivery"
                        checked={checkoutPreferences.fulfillmentMethod === 'delivery'}
                        onChange={() =>
                          updateCheckoutPreferences({
                            fulfillmentMethod: 'delivery'
                          })
                        }
                      />
                    </div>
                    {checkoutPreferences.fulfillmentMethod === 'delivery' && (
                      <Form.Select
                        className="happy-tails-cart-shipping-select"
                        value={checkoutPreferences.shippingOption}
                        onChange={(e) =>
                          updateCheckoutPreferences({
                            shippingOption: e.target.value
                          })
                        }
                      >
                        {SHIPPING_OPTIONS.map((option) => (
                          <option key={option.value || 'placeholder'} value={option.value}>
                            {option.label}{option.fee ? ` - ${formatCurrency(option.fee)}` : ''}
                          </option>
                        ))}
                      </Form.Select>
                    )}
                    <p className="happy-tails-cart-shipping-preview">
                      Shipping Fee: {checkoutPreferences.fulfillmentMethod === 'pickup' ? 'Free' : formatCurrency(shippingFee)}
                    </p>
                  </div>
                  <div className="happy-tails-cart-grand-total">
                    <h5>Total: {formatCurrency(getCartTotal() + shippingFee)}</h5>
                  </div>
                </div>
              </>
            )}
          </Modal.Body>
          <Modal.Footer className="happy-tails-cart-footer">
            <Button 
              variant="secondary" 
              onClick={() => setCartVisible(false)}
              className="happy-tails-continue-shopping"
            >
              Continue Shopping
            </Button>
            {cart.length > 0 && (
              <Button 
                className="happy-tails-checkout-btn"
                onClick={() => {
                  setCartVisible(false);
                  if (user) {
                    navigate('/checkout');
                  } else {
                    setShowAuth(true);
                  }
                }}
              >
                Proceed to Checkout ({formatCurrency(getCartTotal() + shippingFee)})
              </Button>
            )}
          </Modal.Footer>
        </Modal>
      </Container>
      <AuthModal
        show={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={() => {
          setShowAuth(false);
          navigate('/checkout');
        }}
      />
    </div>
  );
};

export default Shop;
