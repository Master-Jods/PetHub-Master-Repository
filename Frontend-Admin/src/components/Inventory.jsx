import React, { useEffect, useMemo, useState } from 'react';
import './Inventory.css';
import { siteConfirm } from '../utils/siteConfirm';
import { toFriendlyMessage } from '../utils/friendlyMessage';

const PRODUCT_TYPES = ['Pet Shop', 'Pet Menu'];
const PET_TYPES = ['All Pets', 'Dogs', 'Cats'];
const STOCK_LEVELS = ['All Stock Levels', 'In Stock', 'Low Stock (<10)', 'Out of Stock'];
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const img = (file) => new URL(`../assets/${file}`, import.meta.url).href;

const product = (
  id,
  name,
  category,
  petType,
  price,
  stock,
  brand,
  description,
  imageFile,
  variations = [],
  productType = 'Pet Shop',
  stockValue = stock
) => ({
  id,
  productType,
  name,
  category,
  petType,
  price,
  stock: stockValue,
  brand,
  description,
  image: img(imageFile),
  variations,
});

const menuProduct = (
  id,
  name,
  category,
  petType,
  price,
  stock,
  imageFile,
  variations = [],
  brand = 'Happy Tails Kitchen',
  description = 'Freshly prepared menu item for pets.'
) => product(id, name, category, petType, price, stock, brand, description, imageFile, variations, 'Pet Menu', stock);

const initialProducts = [
  product(1, 'Knot Bone Pet Dental Treats', 'Pet Food & Treats', 'Dogs', 9, 15, 'Knot Bone', 'Dental cleaning treats that help reduce tartar and freshen breath. Available in multiple delicious flavors.', 'id1.jpg', [
    { id: 'milk', name: 'Milk', price: 9 }, { id: 'banana', name: 'Banana', price: 9 }, { id: 'chicken', name: 'Chicken', price: 9 }, { id: 'beef', name: 'Beef', price: 9 }, { id: 'bbq', name: 'BBQ', price: 10 }, { id: 'lamb', name: 'Lamb', price: 10 }, { id: 'strawberry', name: 'Strawberry', price: 10 }, { id: 'apple', name: 'Apple', price: 10 }, { id: 'blueberry', name: 'Blueberry', price: 10 },
  ]),
  product(2, 'Dog Dental Treats in Jar', 'Pet Food & Treats', 'Dogs', 95, 14, 'Pet Dental', 'Dental hygiene treats in a reusable jar. Helps clean teeth and freshen breath with natural ingredients.', 'id2.jpg', [
    { id: 'chicken', name: 'Chicken', price: 95 }, { id: 'tea', name: 'Tea', price: 95 }, { id: 'beef', name: 'Beef', price: 95 }, { id: 'milk', name: 'Milk', price: 95 }, { id: 'mixed', name: 'Mixed', price: 95 }, { id: 'strawberry', name: 'Strawberry', price: 95 },
  ]),
  product(3, 'JerHigh Dog Treats 70g', 'Pet Food & Treats', 'Dogs', 119, 26, 'JerHigh', 'Soft and tasty snacks made with real chicken meat. High-protein treat perfect for training or rewarding your dog.', 'id3.jpg'),
  product(4, 'CatCare Cat Food 1kg', 'Pet Food & Treats', 'Cats', 279, 19, 'CatCare', 'Complete urinary health support for cats of all life stages. Original packaging ensures freshness and quality.', 'id4.jpg'),
  product(5, '1KG Vitality Value Meal Adult', 'Pet Food & Treats', 'Dogs', 190, 40, 'Vitality', 'Complete and balanced adult dog food with essential vitamins and minerals for daily vitality.', 'id5.jpg'),
  product(6, 'Royal Canin Mini Puppy Wet Food 85g', 'Pet Food & Treats', 'Dogs', 79, 35, 'Royal Canin', 'Specialized wet food for small breed puppies aged 2-10 months. Supports healthy growth and development.', 'id6.jpg'),
  product(7, 'Prof Bengal Kind Kibble Dry Cat Food 400g', 'Pet Food & Treats', 'Cats', 235, 14, 'Prof', 'Premium dry cat food with chicken recipe, formulated for Bengal cats and active felines.', 'id7.jpg'),
  product(8, 'Petplus Doggie Biscuit 80g', 'Pet Food & Treats', 'Dogs', 95, 23, 'Petplus', 'Crunchy bone-shaped biscuits for dogs. Helps clean teeth while providing a tasty snack.', 'id8.jpg'),
  product(9, 'Pedigree Wet Dog Food in Can 400g', 'Pet Food & Treats', 'Dogs', 155, 56, 'Pedigree', 'Complete and balanced wet dog food in convenient canned format. Rich in protein and essential nutrients.', 'id9.jpg', [
    { id: 'puppy', name: 'Puppy', price: 155 }, { id: 'chicken', name: 'Chicken', price: 155 }, { id: 'beef', name: 'Beef', price: 155 },
  ]),
  product(10, 'Royal Canin British Shorthair Adult Wet Cat Food 85g', 'Pet Food & Treats', 'Cats', 89, 24, 'Royal Canin', 'Specialized wet food for British Shorthair adult cats. Supports urinary health and maintains ideal weight.', 'id10.jpg'),
  product(11, 'Bayopet Anti Tick and Flea Dog Soap 90g', 'Pet Grooming Supplies', 'Dogs', 119, 40, 'Bayopet', 'Medicated soap for dogs that effectively eliminates ticks and fleas while cleaning and deodorizing.', 'id11.jpg'),
  product(12, 'St. Roche Dog Conditioner 500ml', 'Pet Grooming Supplies', 'Dogs', 408, 19, 'St. Roche', 'Premium conditioner for dogs that softens fur, reduces tangles, and leaves a pleasant scent.', 'id12.jpg', [
    { id: 'mother-nature', name: 'Mother Nature', price: 408 }, { id: 'happiness', name: 'Happiness', price: 408 }, { id: 'sweet-embrace', name: 'Sweet Embrace', price: 408 }, { id: 'heaven-scent', name: 'Heaven Scent', price: 408 },
  ]),
  product(13, 'Doggies Care Pet Shampoo with Conditioner 1gallon', 'Pet Grooming Supplies', 'Dogs', 349, 35, 'Doggies Care', 'Natural shampoo with madre de cacao and guava extract. Cleans, conditions, and detangles pet fur.', 'id13.jpg', [
    { id: 'bubblegum', name: 'Bubblegum', price: 349 }, { id: 'lavender', name: 'Lavender', price: 349 }, { id: 'strawberry', name: 'Strawberry', price: 349 }, { id: 'vanilla', name: 'Vanilla', price: 349 },
  ]),
  product(14, 'Bearing Dog Shampoo', 'Pet Grooming Supplies', 'Dogs', 158, 53, 'Bearing', 'Anti-tick, flea, and odor eliminator shampoo for all dog types. Promotes healthy skin and coat.', 'id14.jpg', [
    { id: 'all-dogs-150ml', name: 'For All Dogs 150ml', price: 158 }, { id: 'smelly-hair-150ml', name: 'Smelly Hair 150ml', price: 158 }, { id: 'small-breeds-150ml', name: 'For Small Breeds 150ml', price: 158 }, { id: 'long-hair-150ml', name: 'Long Hair 150ml', price: 158 }, { id: 'all-dogs-300ml', name: 'For All Dogs 300ml', price: 268 }, { id: 'smelly-hair-300ml', name: 'Smelly Hair 300ml', price: 268 }, { id: 'small-breeds-300ml', name: 'For Small Breeds 300ml', price: 268 }, { id: 'long-hair-300ml', name: 'Long Hair 300ml', price: 268 },
  ]),
  product(15, 'Pet Single Grooming Stainless Dematting/Deshedding Comb', 'Pet Grooming Supplies', 'All Pets', 69, 44, 'Pet Grooming', "Stainless steel comb for removing mats, tangles, and loose fur from pets' coats.", 'id15.jpg', [
    { id: 'blue', name: 'Blue', price: 69 }, { id: 'red', name: 'Red', price: 69 }, { id: 'green', name: 'Green', price: 69 },
  ]),
  product(16, 'Bioline Pet Toothpaste 100g', 'Pet Grooming Supplies', 'All Pets', 89, 26, 'Bioline', 'Specialty toothpaste for pets that promotes dental health and fresh breath.', 'id16.jpg', [
    { id: 'beef', name: 'Beef', price: 95 }, { id: 'mint', name: 'Mint', price: 95 }, { id: 'orange', name: 'Orange', price: 95 }, { id: 'cheese-cat', name: 'Cheese', price: 89 }, { id: 'chicken', name: 'Chicken', price: 95 },
  ]),
  product(17, 'Eye Doctor Eye Drop Cleanser OTC', 'Pet Grooming Supplies', 'All Pets', 85, 23, 'Playpets', 'Gentle eye drop cleanser for pets that removes dirt and discharge while soothing irritation.', 'id17.jpg', [
    { id: '30ml', name: '30ml', price: 85 }, { id: '120ml', name: '120ml', price: 199 },
  ]),
  product(18, 'Bearing Cat Shampoo 250ml', 'Pet Grooming Supplies', 'Cats', 250, 19, 'Bearing', 'Specialty shampoo formulated for cats with different coat and skin needs.', 'id18.jpg', [
    { id: 'shed-control', name: 'Shed Control', price: 250 }, { id: 'dry-sensitive', name: 'Dry & Sensitive Skin', price: 250 }, { id: 'miracle-brightening', name: 'Miracle Brightening', price: 250 },
  ]),
  product(19, 'Pet Pedicure Electric Pet Nail Trimmer', 'Pet Grooming Supplies', 'All Pets', 95, 40, 'Pet Pedicure', 'Electric nail trimmer with extra filer for safe and easy pet nail grooming at home.', 'id19.jpg'),
  product(20, 'Pampered Pooch Sweet Scent 260ml - Buy 1 Take 1', 'Pet Grooming Supplies', 'Dogs', 249, 31, 'Pampered Pooch', 'Long-lasting fragrance spray for dogs. Buy one get one free offer leaves your pet smelling fresh.', 'id20.jpg'),
  product(21, 'Dextrovet Pet Dextrose Powder 100g', 'Health & Wellness', 'All Pets', 65, 23, 'Dextrovet', 'Energy supplement powder that provides quick glucose boost for weak, recovering, or stressed pets.', 'id21.jpg'),
  product(22, 'Pawpy DOX50 Doxycycline Syrup 50mg (60ml)', 'Health & Wellness', 'All Pets', 289, 15, 'Pawpy', 'Over-the-counter antibiotic syrup for dogs and cats. Effective against various bacterial infections.', 'id22.jpg'),
  product(23, 'Top Of My Game Multivitamins 60ml', 'Health & Wellness', 'All Pets', 50, 44, 'Top Of My Game', 'Multivitamin supplement for dogs and cats ages 6 months to 5 years old. Supports overall health and vitality.', 'id23.jpg'),
  product(24, 'LC Vit Plus for Cats/Kittens', 'Health & Wellness', 'Cats', 135, 28, 'LC Vit', 'Vitamin supplement specially formulated for cats and kittens to support immune system and growth.', 'id24.jpg', [
    { id: '60ml', name: '60ml', price: 135 }, { id: '120ml', name: '120ml', price: 185 }, { id: '160ml', name: '160ml', price: 185 },
  ]),
  product(25, 'Alpha-Vit Multivitamins 120ml', 'Health & Wellness', 'All Pets', 239, 24, 'Alpha-Vit', 'Complete multivitamin supplement for pets that promotes overall wellness and energy levels.', 'id25.jpg'),
  product(26, 'Broncho Aid 60ml', 'Health & Wellness', 'All Pets', 209, 20, 'Broncho Aid', 'Herbal supplement for cough and cold symptoms in dogs and cats. Natural relief for respiratory issues.', 'id26.jpg'),
  product(27, 'Deltacal Chewable Calcium Pet Supplement Tablet', 'Health & Wellness', 'All Pets', 70, 30, 'Deltacal', 'Chewable calcium tablets for strong bones and teeth. Supports skeletal health in growing and adult pets.', 'id27.jpg', [
    { id: '10-tablets', name: '10 tablets', price: 70 }, { id: '50-tablets', name: '1 bottle (50 tablets)', price: 280 },
  ]),
  product(28, 'Dr Shiba Anti Tick and Flea Spray for Dogs and Cats 250ml', 'Health & Wellness', 'All Pets', 339, 35, 'Dr Shiba', 'Veterinary-grade spray that effectively eliminates ticks, fleas, and prevents reinfestation.', 'id28.jpg'),
  product(29, "Vetcore Nature's Advance Tick and Flea Spray 250ml", 'Health & Wellness', 'All Pets', 349, 26, 'Vetcore', 'Advanced formula tick and flea spray with natural ingredients. Provides long-lasting protection.', 'id29.jpg'),
  product(30, 'NEW Petsmed Dextrose Powder 100g', 'Health & Wellness', 'All Pets', 57, 19, 'Petsmed', 'New formula dextrose powder for quick energy recovery in weak, dehydrated, or convalescing pets.', 'id30.jpg'),
  product(31, 'Dono Disposable Male Belly Wrap Male Diaper 1pc', 'Litter & Toilet', 'Dogs', 15, 40, 'Dono', 'Disposable belly wrap diaper for male dogs. Ideal for incontinence, marking, or post-surgery care.', 'id31.jpg', [
    { id: 'xs', name: 'XS', price: 15 }, { id: 's', name: 'S', price: 20 }, { id: 'm', name: 'M', price: 25 }, { id: 'l', name: 'L', price: 30 },
  ]),
  product(32, 'Purreetty Cat Litter Sand', 'Litter & Toilet', 'Cats', 65, 56, 'Purreetty', 'Clumping cat litter sand with pleasant scents. Controls odor and makes cleaning easy.', 'id32.jpg', [
    { id: '1kg-lemon', name: '1kg Lemon', price: 65 }, { id: '1kg-lavender', name: '1kg Lavender', price: 65 }, { id: '5l-lemon', name: '5L Lemon', price: 165 }, { id: '5l-lavender', name: '5L Lavender', price: 165 },
  ]),
  product(33, 'Cattitude Cat Litter Sand 10L', 'Litter & Toilet', 'Cats', 259, 48, 'Cattitude', 'Premium clumping cat litter with various scents. Excellent odor control and low dust formula.', 'id33.jpg', [
    { id: 'apple', name: 'Apple', price: 259 }, { id: 'mango', name: 'Mango', price: 259 }, { id: 'coffee', name: 'Coffee', price: 259 }, { id: 'lavender', name: 'Lavender', price: 259 }, { id: 'lemon', name: 'Lemon', price: 259 }, { id: 'strawberry', name: 'Strawberry', price: 275 },
  ]),
  product(34, 'Bioline Potty Puppy Training Spray 50ml', 'Litter & Toilet', 'Dogs', 129, 26, 'Bioline', 'Training spray that attracts puppies to designated potty areas. Speeds up housebreaking process.', 'id34.jpg'),
  product(35, 'Pet Washable Diaper (Female) Random Design', 'Litter & Toilet', 'Dogs', 119, 35, 'Pet Comfort', 'Reusable washable diaper for female pets. Comes in random cute designs with adjustable fit.', 'id35.jpg', [
    { id: 'xs', name: 'XS', price: 119 }, { id: 's', name: 'S', price: 119 }, { id: 'm', name: 'M', price: 119 }, { id: 'l', name: 'L', price: 119 }, { id: 'xl', name: 'XL', price: 119 },
  ]),
  product(36, 'Warrior Scented Premium Cat Litter Sand 10L', 'Litter & Toilet', 'Cats', 289, 40, 'Warrior', 'Premium scented cat litter with superior clumping and odor neutralizing properties.', 'id36.jpg', [
    { id: 'lavender', name: 'Lavender', price: 289 }, { id: 'lemon', name: 'Lemon', price: 289 }, { id: 'forest', name: 'Forest', price: 289 }, { id: 'blueberry', name: 'Blueberry', price: 289 }, { id: 'apple', name: 'Apple', price: 289 },
  ]),
  product(37, 'Disposable Pet Blue Pad', 'Litter & Toilet', 'All Pets', 6, 82, 'Pet Care', 'Disposable absorbent pads for training, elderly pets, or post-surgical care. Quick-dry top layer.', 'id37.jpg', [
    { id: 's', name: 'S', price: 6 }, { id: 'm', name: 'M', price: 9 },
  ]),
  product(38, 'Pet Belly Band (Washable Diaper for Male)', 'Litter & Toilet', 'Dogs', 120, 24, 'Pet Comfort', 'Reusable belly band for male dogs. Adjustable and washable, ideal for marking or incontinence.', 'id38.jpg', [
    { id: 'xs', name: 'XS', price: 120 }, { id: 's', name: 'S', price: 120 }, { id: 'm', name: 'M', price: 120 }, { id: 'l', name: 'L', price: 120 },
  ]),
  product(39, 'Pet Poop Garbage Bag with Paw Print', 'Litter & Toilet', 'All Pets', 12, 107, 'Pet Clean', 'Biodegradable poop bags with cute paw print design. Eco-friendly and leak-proof for clean disposal.', 'id39.jpg'),
  product(40, 'Wizpoop 30ml Organic Odor Eliminator/Disinfectant/Poop Dryer', 'Litter & Toilet', 'All Pets', 65, 35, 'Wizpoop', 'Triple-action formula that eliminates odors, disinfects surfaces, and dries pet waste quickly.', 'id40.jpg'),
  product(41, 'Squeaky Flat Bone Toy with Paws and Bones Design', 'Pet Accessories & Toys', 'Dogs', 45, 40, 'Pet Play', 'Fun squeaky bone-shaped toy with paw and bone prints. Durable and entertaining for playtime.', 'id41.jpg'),
  product(42, 'Pet Toy Braided Rope 17cm', 'Pet Accessories & Toys', 'Dogs', 25, 56, 'Pet Play', 'Braided rope toy for tug-of-war and dental cleaning. Random colors available for durable play.', 'id42.jpg'),
  product(43, 'Yellow Chix Squeaky Pet Toy 17cm', 'Pet Accessories & Toys', 'Dogs', 55, 35, 'Pet Play', 'Bright yellow chicken-shaped squeaky toy. Perfect for fetch and interactive play sessions.', 'id43.jpg'),
  product(44, 'Cat Spiral Tower Toy with Free Balls', 'Pet Accessories & Toys', 'Cats', 149, 24, 'Cat Enrichment', 'Interactive spiral tower with balls for cats to bat and chase. Stimulates natural hunting instincts.', 'id44.jpg'),
  product(45, '3-in-1 Rubber Pet Ball Toy', 'Pet Accessories & Toys', 'Dogs', 69, 40, 'Pet Play', 'Multi-functional rubber ball toy that bounces, floats, and can hold treats for extended play.', 'id45.jpg'),
  product(46, 'Candy Colored Pet Plastic Bowl 12.5x5cm', 'Pet Accessories & Toys', 'All Pets', 25, 65, 'Pet Essentials', 'Vibrant plastic feeding bowl in candy colors. Perfect for small pets or as a treat dish.', 'id46.jpg', [
    { id: 'blue', name: 'Blue', price: 25 }, { id: 'green', name: 'Green', price: 25 }, { id: 'pink', name: 'Pink', price: 25 },
  ]),
  product(47, 'Rainbow Round Pet Harness and Leash Set (Small)', 'Pet Accessories & Toys', 'Dogs', 95, 26, 'Pet Fashion', 'Colorful rainbow-pattern harness and leash set for small dogs. Comfortable and secure fit.', 'id47.jpg'),
  product(48, 'Pet Sunglass / Eyeglass', 'Pet Accessories & Toys', 'Dogs', 59, 23, 'Pet Fashion', 'Stylish sunglasses for pets with UV protection. Perfect for photos or sunny outdoor adventures.', 'id48.jpg', [
    { id: 'pink', name: 'Pink', price: 59 }, { id: 'black', name: 'Black', price: 59 }, { id: 'violet', name: 'Violet', price: 59 }, { id: 'clear', name: 'Clear', price: 59 }, { id: 'red', name: 'Red', price: 59 }, { id: 'yellow', name: 'Yellow', price: 59 },
  ]),
  product(49, 'Pet Foldable Tent Playpen', 'Pet Accessories & Toys', 'All Pets', 550, 15, 'Pet Home', 'Portable foldable tent playpen for pets. Great for travel, containment, or creating a safe play area.', 'id49.jpg', [
    { id: 'brown', name: 'Brown', price: 550 }, { id: 'red', name: 'Red', price: 550 }, { id: 'gray', name: 'Gray', price: 550 },
  ]),
  product(50, 'Single Pet Collar Rainbow 2.0', 'Pet Accessories & Toys', 'All Pets', 49, 48, 'Pet Fashion', 'Colorful rainbow-pattern adjustable collar with secure buckle. Stylish and functional for daily wear.', 'id50.jpg'),
  menuProduct(101, 'Chicken Macarons', 'Pet Treats', 'Dogs', 230, 18, 'chickenmacarons.jpg', [], 'Happy Tails Kitchen', 'Soft baked pet macarons made with chicken for special rewards.'),
  menuProduct(102, 'Pav Jell-O Shots', 'Frozen Treats', 'Dogs', 250, 14, 'jell-o.png', [], 'Happy Tails Kitchen', 'Refreshing frozen treat made for fun pet celebrations.'),
  menuProduct(103, 'Assorted Paw Skewers', 'Pet Treats', 'Dogs', 200, 20, 'assortedpawskewers.jpg', [], 'Happy Tails Kitchen', 'Assorted bite-sized paw skewers for snack platters and events.'),
  menuProduct(104, 'Sweet Potato Madeleines', 'Pet Treats', 'Dogs', 220, 16, 'sweetpotatomadeleines.jpg', [], 'Happy Tails Kitchen', 'Sweet potato pet pastries with a soft and gentle texture.'),
  menuProduct(105, 'Chicken Mini Cookies', 'Pet Treats', 'Dogs', 250, 22, 'chickenminicookies.jpg', [], 'Happy Tails Kitchen', 'Mini chicken cookies perfect for everyday treats and party packs.'),
  menuProduct(106, 'Mackerel Muffins', 'Pet Treats', 'Dogs', 150, 12, 'mackerelmuffins.jpg', [], 'Happy Tails Kitchen', 'Savory muffins with mackerel flavor made for pet snack time.'),
  menuProduct(107, 'Dog Bento Cake', 'For Dogs', 'Dogs', 280, 10, 'dogbento.png', [], 'Happy Tails Kitchen', 'Celebration bento cake specially prepared for dogs.'),
  menuProduct(108, 'Pupcake', 'For Dogs', 'Dogs', 85, 24, 'pupcake.jpg', [
    { id: 'carrot-peanut', name: 'Carrot with Peanut Butter', price: 85 },
    { id: 'squash-banana', name: 'Squash with Banana', price: 85 },
  ], 'Happy Tails Kitchen', 'Mini celebration cupcake for dogs with flavor options.'),
  menuProduct(109, 'Puppuccino', 'Frozen Treats', 'Dogs', 70, 28, 'puppucino.jpg', [], 'Happy Tails Kitchen', 'Chilled creamy treat made for dogs to enjoy on hot days.'),
  menuProduct(110, 'Pet Dognut', 'For Dogs', 'Dogs', 180, 15, 'petdognat.png', [
    { id: 'chicken-liver', name: 'Chicken Liver', price: 180 },
    { id: 'apple-carrot', name: 'Apple & Carrot', price: 180 },
    { id: 'peanut-bacon', name: 'Peanut Butter & Bacon', price: 180 },
  ], 'Happy Tails Kitchen', 'Dog-friendly donut treat with multiple flavors.'),
  menuProduct(111, 'Woofle', 'For Dogs', 'Dogs', 50, 19, 'woofle.jpg', [
    { id: 'plain', name: 'Plain', price: 50 },
    { id: 'chicken-liver', name: 'Chicken Liver', price: 70 },
    { id: 'moringa', name: 'Moringa', price: 60 },
    { id: 'pork-liver', name: 'Pork Liver', price: 70 },
  ], 'Happy Tails Kitchen', 'Pet waffle treat with sweet and savory flavor choices.'),
  menuProduct(112, 'Doggie Pizza', 'For Dogs', 'Dogs', 120, 11, 'pizza.png', [
    { id: 'small', name: 'Small', price: 120 },
    { id: 'large', name: 'Large', price: 150 },
  ], 'Happy Tails Kitchen', 'Pet-safe pizza served in small and large sizes.'),
  menuProduct(113, 'Cat Bento Cake', 'For Cats', 'Cats', 290, 8, 'catbento.png', [], 'Happy Tails Kitchen', 'Celebration bento cake created specially for cats.'),
  menuProduct(114, 'Cat Cupcake', 'For Cats', 'Cats', 95, 17, 'catcupcake.jpg', [], 'Happy Tails Kitchen', 'Cat-friendly cupcake perfect for birthdays and special occasions.'),
  menuProduct(115, 'Pet Party Hat', 'All', 'All Pets', 35, 35, 'partyhat.png', [], 'Happy Tails Party', 'Cute party accessory for birthdays and pet events.'),
  menuProduct(116, 'Pet Banner Set', 'All', 'All Pets', 250, 9, 'banner.png', [], 'Happy Tails Party', 'Decorative banner set for pet celebrations and themed setups.'),
  menuProduct(117, 'Colored Candle', 'All', 'All Pets', 5, 50, 'candle.jpg', [], 'Happy Tails Party', 'Simple colored candle for cakes and pet event setups.'),
  menuProduct(118, 'Number Candle', 'All', 'All Pets', 18, 40, 'numbercandle.jpg', [], 'Happy Tails Party', 'Number candle for age-themed pet celebrations.'),
  menuProduct(119, 'Pawgurts Frozen Yogurt', 'Frozen Treats', 'Dogs', 150, 13, 'pawgurts.png', [
    { id: 'mango', name: 'Mango', price: 150 },
    { id: 'cucumber', name: 'Cucumber', price: 150 },
    { id: 'sweet-potato', name: 'Sweet Potato', price: 150 },
    { id: 'apple', name: 'Apple', price: 150 },
    { id: 'banana', name: 'Banana', price: 150 },
    { id: 'peanut-butter', name: 'Peanut Butter', price: 150 },
    { id: 'strawberry', name: 'Strawberry', price: 150 },
  ], 'Happy Tails Kitchen', 'Frozen yogurt treat with different dog-friendly flavors.'),
  menuProduct(120, 'Paw Skewers Tofu', 'Pet Treats', 'Dogs', 200, 14, 'pawskewerstofu.jpg', [], 'Happy Tails Kitchen', 'Tofu-based paw skewers for snack trays and events.'),
  menuProduct(121, 'Paw Skewers Kwek-Kwek', 'Pet Treats', 'Dogs', 250, 12, 'pawskewerskwekkwek.jpg', [], 'Happy Tails Kitchen', 'Kwek-kwek inspired paw skewers made for fun pet menu offerings.'),
];

const baseFormState = {
  productType: 'Pet Shop',
  name: '',
  category: 'Pet Food & Treats',
  petType: 'All Pets',
  price: '',
  stock: '',
  brand: '',
  description: '',
  image: null,
  imageName: '',
  variations: [],
};

const resolveInventoryImage = (image) => {
  if (!image) return '';
  if (image.startsWith('data:') || image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }

  try {
    return img(image);
  } catch (_error) {
    return image;
  }
};

const serializeProduct = (form, existingImage = null) => ({
  productType: form.productType,
  name: form.name,
  category: form.category,
  petType: form.petType,
  price: Number(form.price),
  stock: Number(form.stock),
  brand: form.brand,
  description: form.description,
  image: form.image || existingImage || '',
  variations: form.variations
    .filter((variation) => variation.name && variation.price !== '')
    .map((variation) => ({ ...variation, price: Number(variation.price) })),
});

const toFormState = (productItem) => ({
  productType: productItem.productType,
  name: productItem.name,
  category: productItem.category,
  petType: productItem.petType,
  price: String(productItem.price),
  stock: productItem.stock === null ? '' : String(productItem.stock),
  brand: productItem.brand,
  description: productItem.description,
  image: productItem.imagePath || productItem.image,
  imageName: '',
  variations: productItem.variations.map((variation) => ({ ...variation, price: String(variation.price) })),
});

function Inventory() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTypeTab, setActiveTypeTab] = useState('Pet Shop');
  const [category, setCategory] = useState('All Categories');
  const [sortBy, setSortBy] = useState('name-asc');
  const [stockLevel, setStockLevel] = useState('All Stock Levels');
  const [selectedPetType, setSelectedPetType] = useState('All Pets');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [newProduct, setNewProduct] = useState(baseFormState);
  const [editForm, setEditForm] = useState(baseFormState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingStockId, setSavingStockId] = useState(null);
  const [stockDrafts, setStockDrafts] = useState({});
  const [error, setError] = useState('');

  const loadInventory = async ({ showLoader = true } = {}) => {
    if (showLoader) setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/inventory`);
      if (!response.ok) {
        throw new Error('Failed to fetch inventory.');
      }

      const payload = await response.json();
      const fetchedProducts = payload.products ?? [];
      const normalizedProducts = fetchedProducts.map((item) => ({
        ...item,
        imagePath: item.imagePath || item.image,
        image: resolveInventoryImage(item.imagePath || item.image),
      }));
      setProducts(normalizedProducts);
      setStockDrafts(Object.fromEntries(normalizedProducts.map((item) => [item.id, String(item.stock ?? 0)])));
    } catch (fetchError) {
      setError(toFriendlyMessage(fetchError.message, 'We couldn’t load the inventory right now.'));
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory({ showLoader: true });

    const intervalId = window.setInterval(() => {
      loadInventory({ showLoader: false });
    }, 60000);

    const handleWindowFocus = () => {
      loadInventory({ showLoader: false });
    };

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  const categories = useMemo(() => {
    const items = products.filter((item) => item.productType === activeTypeTab);
    return ['All Categories', ...new Set(items.map((item) => item.category))];
  }, [products, activeTypeTab]);

  const getCategoryOptions = (productType) => (
    productType === 'Pet Menu'
      ? ['Pet Treats', 'Frozen Treats', 'For Dogs', 'For Cats', 'All']
      : ['Pet Food & Treats', 'Pet Grooming Supplies', 'Health & Wellness', 'Litter & Toilet', 'Pet Accessories & Toys']
  );

  const handleImageUpload = (event, target) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageUrl = typeof reader.result === 'string' ? reader.result : '';

      if (target === 'add') {
        setNewProduct((prev) => ({ ...prev, image: imageUrl, imageName: file.name }));
        return;
      }

      setEditForm((prev) => ({ ...prev, image: imageUrl, imageName: file.name }));
    };
    reader.readAsDataURL(file);
  };

  const handleVariationChange = (target, index, field, value) => {
    const update = (prev) => ({
      ...prev,
      variations: prev.variations.map((variation, variationIndex) => (
        variationIndex === index ? { ...variation, [field]: value } : variation
      )),
    });

    if (target === 'add') {
      setNewProduct(update);
      return;
    }

    setEditForm(update);
  };

  const handleAddVariation = (target) => {
    const variation = { id: Date.now(), name: '', price: '' };

    if (target === 'add') {
      setNewProduct((prev) => ({ ...prev, variations: [...prev.variations, variation] }));
      return;
    }

    setEditForm((prev) => ({ ...prev, variations: [...prev.variations, variation] }));
  };

  const handleDeleteVariation = (target, variationId) => {
    if (target === 'add') {
      setNewProduct((prev) => ({ ...prev, variations: prev.variations.filter((variation) => variation.id !== variationId) }));
      return;
    }

    setEditForm((prev) => ({ ...prev, variations: prev.variations.filter((variation) => variation.id !== variationId) }));
  };

  const handleInputChange = (event, target) => {
    const { name, value } = event.target;
    const update = (prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'productType' ? { category: getCategoryOptions(value)[0], stock: value === 'Pet Menu' ? '' : prev.stock } : {}),
    });

    if (target === 'add') {
      setNewProduct(update);
      return;
    }

    setEditForm(update);
  };

  const syncProductList = (updater) => {
    setProducts((prev) => {
      const nextProducts = updater(prev);
      setStockDrafts((currentDrafts) => ({
        ...currentDrafts,
        ...Object.fromEntries(nextProducts.map((item) => [item.id, String(item.stock ?? 0)])),
      }));
      return nextProducts;
    });
  };

  const handleAddProduct = (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    fetch(`${API_BASE_URL}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serializeProduct(newProduct)),
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to add product.');
        }

        syncProductList((prev) => [...prev, {
          ...payload.product,
          imagePath: payload.product.imagePath || payload.product.image,
          image: resolveInventoryImage(payload.product.imagePath || payload.product.image),
        }]);
        setNewProduct(baseFormState);
        setIsAddModalOpen(false);
      })
      .catch((saveError) => {
        setError(toFriendlyMessage(saveError.message, 'We couldn’t add that product right now.'));
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const handleEditProduct = (productItem) => {
    setSelectedProduct(productItem);
    setEditForm(toFormState(productItem));
    setIsEditModalOpen(true);
    setActiveDropdown(null);
  };

  const handleSaveEdit = (event) => {
    event.preventDefault();
    if (!selectedProduct) return;
    setSaving(true);
    setError('');

    fetch(`${API_BASE_URL}/inventory/${selectedProduct.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serializeProduct(editForm, selectedProduct.imagePath || selectedProduct.image)),
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to update product.');
        }

        syncProductList((prev) => prev.map((item) => (
          item.id === selectedProduct.id
            ? {
                ...payload.product,
                imagePath: payload.product.imagePath || payload.product.image,
                image: resolveInventoryImage(payload.product.imagePath || payload.product.image),
              }
            : item
        )));
        setIsEditModalOpen(false);
        setSelectedProduct(null);
      })
      .catch((saveError) => {
        setError(toFriendlyMessage(saveError.message, 'We couldn’t update that product right now.'));
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const handleDeleteProduct = async (productId) => {
    if (!(await siteConfirm('Are you sure you want to delete this product?'))) {
      setActiveDropdown(null);
      return;
    }

      setSaving(true);
      setError('');

      fetch(`${API_BASE_URL}/inventory/${productId}`, {
        method: 'DELETE',
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to delete product.');
          }

          syncProductList((prev) => prev.filter((item) => item.id !== productId));
        })
        .catch((deleteError) => {
          setError(toFriendlyMessage(deleteError.message, 'We couldn’t remove that product right now.'));
        })
        .finally(() => {
          setSaving(false);
        });
    setActiveDropdown(null);
  };

  const handleStockDraftChange = (productId, value) => {
    if (value === '' || /^\d+$/.test(value)) {
      setStockDrafts((prev) => ({ ...prev, [productId]: value }));
    }
  };

  const handleStockSave = async (productItem) => {
    const draftValue = stockDrafts[productItem.id];
    if (draftValue === '') {
      return;
    }
    const parsedStock = Number(draftValue);

    if (!Number.isInteger(parsedStock) || parsedStock < 0 || parsedStock === productItem.stock) {
      return;
    }

    setSavingStockId(productItem.id);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/inventory/${productItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productType: productItem.productType,
          name: productItem.name,
          category: productItem.category,
          petType: productItem.petType,
          price: productItem.price,
          stock: parsedStock,
          brand: productItem.brand,
          description: productItem.description,
          image: productItem.imagePath || productItem.image,
          variations: productItem.variations,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update stock.');
      }

      syncProductList((prev) => prev.map((item) => (
        item.id === productItem.id
          ? {
              ...payload.product,
              imagePath: payload.product.imagePath || payload.product.image,
              image: resolveInventoryImage(payload.product.imagePath || payload.product.image),
            }
          : item
      )));
    } catch (stockError) {
      setError(toFriendlyMessage(stockError.message, 'We couldn’t update stock right now.'));
    } finally {
      setSavingStockId(null);
    }
  };

  const filteredProducts = products.filter((item) => {
    if (item.productType !== activeTypeTab) return false;

    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === 'All Categories' || item.category === category;
    const matchesPetType = selectedPetType === 'All Pets' || item.petType === selectedPetType;

    let matchesStock = true;
    if (stockLevel === 'In Stock') matchesStock = (item.stock || 0) > 0;
    if (stockLevel === 'Low Stock (<10)') matchesStock = (item.stock || 0) > 0 && (item.stock || 0) < 10;
    if (stockLevel === 'Out of Stock') matchesStock = (item.stock || 0) === 0;

    return matchesSearch && matchesCategory && matchesPetType && matchesStock;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc': return a.name.localeCompare(b.name);
      case 'name-desc': return b.name.localeCompare(a.name);
      case 'price-asc': return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'stock-asc': return (a.stock || 0) - (b.stock || 0);
      case 'stock-desc': return (b.stock || 0) - (a.stock || 0);
      default: return 0;
    }
  });

  const renderStockBadge = (stock) => {
    const safeStock = stock || 0;
    const isOutOfStock = safeStock === 0;
    const isLowStock = safeStock > 0 && safeStock < 10;

    return (
      <div className={`inventory-stock ${isOutOfStock || isLowStock ? 'low-stock' : ''}`}>
        {isOutOfStock ? 'Out of stock' : `${safeStock} in stock`}
      </div>
    );
  };

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <h1>Inventory</h1>
        <p>Manage your products and stock.</p>
      </div>

      <div className="inventory-type-tabs">
        {PRODUCT_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            className={`inventory-type-tab ${activeTypeTab === type ? 'active' : ''}`}
            onClick={() => {
              setActiveTypeTab(type);
              setCategory('All Categories');
            }}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="inventory-filters">
        <input type="text" className="search-input" placeholder="Search items..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
        <select className="filter-select" value={category} onChange={(event) => setCategory(event.target.value)}>
          {categories.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select className="filter-select" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="price-asc">Price (Low to High)</option>
          <option value="price-desc">Price (High to Low)</option>
          {activeTypeTab === 'Pet Shop' && <option value="stock-asc">Stock (Low to High)</option>}
          {activeTypeTab === 'Pet Shop' && <option value="stock-desc">Stock (High to Low)</option>}
        </select>
        <select className="filter-select" value={stockLevel} onChange={(event) => setStockLevel(event.target.value)}>
          {STOCK_LEVELS.map((level) => <option key={level}>{level}</option>)}
        </select>
      </div>

      {error && <div className="inventory-feedback inventory-feedback--error">{error}</div>}
      {loading && <div className="inventory-feedback">Loading inventory...</div>}

      <div className="category-pills">
        {PET_TYPES.map((type) => (
          <button key={type} type="button" className={`category-pill ${selectedPetType === type ? 'active' : ''}`} onClick={() => setSelectedPetType(type)}>
            {type}
          </button>
        ))}
      </div>

      <div className="inventory-grid">
        {sortedProducts.length > 0 ? (
          sortedProducts.map((item) => (
            <div key={item.id} className="inventory-card">
              <div className="product-menu" onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}>
                <span className="dots">•••</span>
                {activeDropdown === item.id && (
                  <div className="dropdown-menu">
                    <button type="button" className="dropdown-item" onClick={() => handleEditProduct(item)}>Edit</button>
                    <button type="button" className="dropdown-item delete" onClick={() => handleDeleteProduct(item.id)}>Delete</button>
                  </div>
                )}
              </div>
              {item.image && <img src={item.image} alt={item.name} className="inventory-card-image" />}
              <h3>{item.name}</h3>
              <div className="inventory-category">{item.category}</div>
              {item.productType === 'Pet Shop' && <div className="inventory-brand">{item.brand}</div>}
              <p className="inventory-description">{item.description}</p>
              <div className="inventory-price">₱{item.price.toFixed(2)}</div>
              {item.variations.length > 0 && (
                <div className="inventory-variants">{item.variations.length} variant{item.variations.length > 1 ? 's' : ''}</div>
              )}
              {renderStockBadge(item.stock)}
              <div className="inventory-stock-editor">
                <label htmlFor={`stock-${item.id}`}>Stock</label>
                <div className="inventory-stock-editor__controls">
                  <input
                    id={`stock-${item.id}`}
                    type="number"
                    min="0"
                    value={stockDrafts[item.id] ?? String(item.stock ?? 0)}
                    onChange={(event) => handleStockDraftChange(item.id, event.target.value)}
                  />
                  <button
                    type="button"
                    className="inventory-stock-editor__save"
                    onClick={() => handleStockSave(item)}
                    disabled={
                      savingStockId === item.id ||
                      stockDrafts[item.id] === '' ||
                      stockDrafts[item.id] === undefined ||
                      Number(stockDrafts[item.id]) === Number(item.stock)
                    }
                  >
                    {savingStockId === item.id ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-products">
            <p>No products found matching your criteria.</p>
            <button className="add-first-btn" onClick={() => setIsAddModalOpen(true)}>Add Your First Product</button>
          </div>
        )}
      </div>

      <button className="add-product-btn" onClick={() => setIsAddModalOpen(true)} disabled={saving}>Add Products</button>
      {isEditModalOpen && selectedProduct && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>EDIT PRODUCT</h2>
              <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>x</button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="edit-product-container">
                <div className="edit-left-column">
                  <div className="product-image-section">
                    <h3>Product Image</h3>
                    <div className={`image-placeholder ${editForm.image ? 'has-image' : ''}`}>
                      {editForm.image ? <img src={editForm.image} alt="Product" /> : <><span>[ ]</span><span>No image selected</span></>}
                    </div>
                    <div className="file-input-container">
                      <label htmlFor="edit-image-upload" className="file-input-label">Choose File</label>
                      <input id="edit-image-upload" type="file" className="file-input" accept="image/*" onChange={(event) => handleImageUpload(event, 'edit')} />
                    </div>
                    <div className="file-name">{editForm.imageName || 'No file chosen'}</div>
                  </div>
                </div>

                <div className="edit-right-column">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Product Type *</label>
                      <select name="productType" value={editForm.productType} onChange={(event) => handleInputChange(event, 'edit')} required>
                        <option>Pet Shop</option>
                        <option>Pet Menu</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Category *</label>
                      <select name="category" value={editForm.category} onChange={(event) => handleInputChange(event, 'edit')} required>
                        {getCategoryOptions(editForm.productType).map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Product Name *</label>
                    <input type="text" name="name" value={editForm.name} onChange={(event) => handleInputChange(event, 'edit')} required />
                  </div>

                  <div className="two-column-grid">
                    <div className="form-group">
                      <label>Price *</label>
                      <input type="number" name="price" value={editForm.price} onChange={(event) => handleInputChange(event, 'edit')} required min="0" step="0.01" />
                    </div>
                    <div className="form-group">
                      <label>Stock Quantity *</label>
                      <input type="number" name="stock" value={editForm.stock} onChange={(event) => handleInputChange(event, 'edit')} required min="0" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Brand</label>
                    <input type="text" name="brand" value={editForm.brand} onChange={(event) => handleInputChange(event, 'edit')} />
                  </div>

                  <div className="variations-section">
                    <div className="variations-header"><h4>Variations</h4></div>
                    {editForm.variations.map((variation, index) => (
                      <div key={variation.id} className="variation-row">
                        <input type="text" placeholder="Variation Name" value={variation.name} onChange={(event) => handleVariationChange('edit', index, 'name', event.target.value)} />
                        <input type="number" placeholder="Price" value={variation.price} onChange={(event) => handleVariationChange('edit', index, 'price', event.target.value)} />
                        <button type="button" className="delete-variation-btn" onClick={() => handleDeleteVariation('edit', variation.id)}>Delete</button>
                      </div>
                    ))}
                    <button type="button" className="add-variation-btn" onClick={() => handleAddVariation('edit')}>+ Add Variation</button>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea name="description" value={editForm.description} onChange={(event) => handleInputChange(event, 'edit')} rows="3" />
                  </div>

                  <div className="form-group">
                    <label>Pet Type *</label>
                    <div className="pet-type-group">
                      {PET_TYPES.map((type) => (
                        <label key={type} className="pet-type-radio">
                          <input type="radio" name="petType" value={type} checked={editForm.petType === type} onChange={(event) => handleInputChange(event, 'edit')} />
                          <span>{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="save-changes-btn" disabled={saving}>{saving ? 'Saving...' : 'Update'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>ADD PRODUCT</h2>
              <button className="close-btn" onClick={() => setIsAddModalOpen(false)}>x</button>
            </div>

            <form onSubmit={handleAddProduct}>
              <div className="edit-product-container">
                <div className="edit-left-column">
                  <div className="product-image-section">
                    <h3>Product Image</h3>
                    <div className={`image-placeholder ${newProduct.image ? 'has-image' : ''}`}>
                      {newProduct.image ? <img src={newProduct.image} alt="Product" /> : <><span>[ ]</span><span>No image selected</span></>}
                    </div>
                    <div className="file-input-container">
                      <label htmlFor="add-image-upload" className="file-input-label">Choose File</label>
                      <input id="add-image-upload" type="file" className="file-input" accept="image/*" onChange={(event) => handleImageUpload(event, 'add')} />
                    </div>
                    <div className="file-name">{newProduct.imageName || 'No file chosen'}</div>
                  </div>
                </div>

                <div className="edit-right-column">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Product Type *</label>
                      <select name="productType" value={newProduct.productType} onChange={(event) => handleInputChange(event, 'add')} required>
                        <option>Pet Shop</option>
                        <option>Pet Menu</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Category *</label>
                      <select name="category" value={newProduct.category} onChange={(event) => handleInputChange(event, 'add')} required>
                        {getCategoryOptions(newProduct.productType).map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Product Name *</label>
                    <input type="text" name="name" value={newProduct.name} onChange={(event) => handleInputChange(event, 'add')} required placeholder="Enter product name" />
                  </div>

                  <div className="two-column-grid">
                    <div className="form-group">
                      <label>Price *</label>
                      <input type="number" name="price" value={newProduct.price} onChange={(event) => handleInputChange(event, 'add')} required min="0" step="0.01" />
                    </div>
                    <div className="form-group">
                      <label>Stock Quantity *</label>
                      <input type="number" name="stock" value={newProduct.stock} onChange={(event) => handleInputChange(event, 'add')} required min="0" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Brand</label>
                    <input type="text" name="brand" value={newProduct.brand} onChange={(event) => handleInputChange(event, 'add')} placeholder="Enter brand" />
                  </div>

                  <div className="variations-section">
                    <div className="variations-header"><h4>Variations</h4></div>
                    {newProduct.variations.map((variation, index) => (
                      <div key={variation.id} className="variation-row">
                        <input type="text" placeholder="Variation Name" value={variation.name} onChange={(event) => handleVariationChange('add', index, 'name', event.target.value)} />
                        <input type="number" placeholder="Price" value={variation.price} onChange={(event) => handleVariationChange('add', index, 'price', event.target.value)} />
                        <button type="button" className="delete-variation-btn" onClick={() => handleDeleteVariation('add', variation.id)}>Delete</button>
                      </div>
                    ))}
                    <button type="button" className="add-variation-btn" onClick={() => handleAddVariation('add')}>+ Add Variation</button>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea name="description" value={newProduct.description} onChange={(event) => handleInputChange(event, 'add')} rows="3" />
                  </div>

                  <div className="form-group">
                    <label>Pet Type *</label>
                    <div className="pet-type-group">
                      {PET_TYPES.map((type) => (
                        <label key={type} className="pet-type-radio">
                          <input type="radio" name="petType" value={type} checked={newProduct.petType === type} onChange={(event) => handleInputChange(event, 'add')} />
                          <span>{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="save-changes-btn" disabled={saving}>{saving ? 'Saving...' : 'Add Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;
