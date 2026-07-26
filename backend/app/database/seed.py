import uuid
import datetime
from decimal import Decimal
from app.database.session import engine, SessionLocal
from app.database.base_class import Base
import app.models
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.invoice import Invoice
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem
from app.models.settings import Settings
from app.models.supplier import Supplier, ProductSupplier
from app.core.security import get_password_hash

REAL_CUSTOMERS = ['Adarsh', 'FOX DEN', 'Fernway by stories', 'Lavish creative LLP', 'PRAAD ESTATE PRIVATE  LIMITED', 'Stories Bar &  Kitchen (80 Feet Alleyway LLP))', 'Stories Bar & Kitchen (Bistro Blues LLP)', 'Stories Bar & Kitchen (Urbaneat LLP)', 'stories Rajajinagar']

REAL_PRODUCTS = [('Aragula/Rocket With Roots Regular', {'category': 'Exotic', 'unit': 'KG', 'price': 240.0}), ('Artichoke', {'category': 'Exotic', 'unit': 'KG', 'price': 400.0}), ('Aspragus Local', {'category': 'Exotic', 'unit': 'KG', 'price': 280.0}), ('Baby Carrots', {'category': 'Exotic', 'unit': 'KG', 'price': 120.0}), ('Baby Potato', {'category': 'Exotic', 'unit': 'KG', 'price': 40.0}), ('Baby Spinach', {'category': 'Exotic', 'unit': 'KG', 'price': 400.0}), ('Basil Green/Italian/Thai', {'category': 'Exotic', 'unit': 'KG', 'price': 130.0}), ('Broccoli', {'category': 'Exotic', 'unit': 'KG', 'price': 130.0}), ('Brussels Sprouts', {'category': 'Exotic', 'unit': 'KG', 'price': 360.0}), ('Buttur Head Lettuce', {'category': 'Exotic', 'unit': 'KG', 'price': 150.0}), ('Capsicum Green', {'category': 'Exotic', 'unit': 'KG', 'price': 55.0}), ('Capsicum Red', {'category': 'Exotic', 'unit': 'KG', 'price': 140.0}), ('Capsicum Yellow', {'category': 'Exotic', 'unit': 'KG', 'price': 140.0}), ('Celery', {'category': 'Exotic', 'unit': 'KG', 'price': 120.0}), ('Cherry Tomatoes Cocktail', {'category': 'Exotic', 'unit': 'KG', 'price': 190.0}), ('Cherry Tomatoes Red', {'category': 'Exotic', 'unit': 'KG', 'price': 130.0}), ('Chinese Cabbage', {'category': 'Exotic', 'unit': 'KG', 'price': 75.0}), ('Chives Garlic', {'category': 'Exotic', 'unit': 'KG', 'price': 700.0}), ('Egg Plant/Brinjal Black Big', {'category': 'Exotic', 'unit': 'KG', 'price': 55.0}), ('English/European Cucumber', {'category': 'Exotic', 'unit': 'KG', 'price': 60.0}), ('Fennel Bulb', {'category': 'Exotic', 'unit': 'KG', 'price': 280.0}), ('Grape Leaves', {'category': 'Exotic', 'unit': 'KG', 'price': 150.0}), ('Halopino/Jalapeño  Fresh', {'category': 'Exotic', 'unit': 'KG', 'price': 400.0}), ('Iceberg Lettuce', {'category': 'Exotic', 'unit': 'KG', 'price': 95.0}), ('Makroot Leaves / Kaffir Lime Leaves', {'category': 'Exotic', 'unit': 'KG', 'price': 1400.0}), ('Kale Curl/Flat', {'category': 'Exotic', 'unit': 'KG', 'price': 240.0}), ('Leeks', {'category': 'Exotic', 'unit': 'KG', 'price': 140.0}), ('Lemongrass', {'category': 'Exotic', 'unit': 'KG', 'price': 120.0}), ('Lollo Green Lettuce (Simpson)', {'category': 'Exotic', 'unit': 'KG', 'price': 150.0}), ('Lollo Rossa Lettuce', {'category': 'Exotic', 'unit': 'KG', 'price': 150.0}), ('Lotus Stem', {'category': 'Exotic', 'unit': 'KG', 'price': 200.0}), ('Mango Ginger', {'category': 'Exotic', 'unit': 'KG', 'price': 200.0}), ('Mustard Leaves', {'category': 'Exotic', 'unit': 'KG', 'price': 200.0}), ('Okra Red', {'category': 'Exotic', 'unit': 'KG', 'price': 150.0}), ('Ooty Beans/Haricot Beans', {'category': 'Exotic', 'unit': 'KG', 'price': 65.0}), ('Oregano Fresh', {'category': 'Exotic', 'unit': 'KG', 'price': 800.0}), ('Parsley Curl/Flat', {'category': 'Exotic', 'unit': 'KG', 'price': 130.0}), ('Pokchoi', {'category': 'Exotic', 'unit': 'KG', 'price': 120.0}), ('Red Cabbage', {'category': 'Exotic', 'unit': 'KG', 'price': 75.0}), ('Red Potato', {'category': 'Exotic', 'unit': 'KG', 'price': 60.0}), ('Red Radish', {'category': 'Exotic', 'unit': 'KG', 'price': 80.0}), ('Rhubarb', {'category': 'Exotic', 'unit': 'KG', 'price': 480.0}), ('Romaine Lettuce', {'category': 'Exotic', 'unit': 'KG', 'price': 140.0}), ('Rosemary Fresh', {'category': 'Exotic', 'unit': 'KG', 'price': 300.0}), ('Sage Fresh', {'category': 'Exotic', 'unit': 'KG', 'price': 600.0}), ('Scotch Bonnet Pepper', {'category': 'Exotic', 'unit': 'KG', 'price': 500.0}), ('Spring Onion/Scallions', {'category': 'Exotic', 'unit': 'KG', 'price': 90.0}), ('Squash Butternut', {'category': 'Exotic', 'unit': 'KG', 'price': 350.0}), ('Swisschards Rainbow', {'category': 'Exotic', 'unit': 'KG', 'price': 220.0}), ('Thai Brinjal', {'category': 'Exotic', 'unit': 'KG', 'price': 300.0}), ('Thai Ginger/Galangal', {'category': 'Exotic', 'unit': 'KG', 'price': 280.0}), ('Thai/Bird Eye Chilli', {'category': 'Exotic', 'unit': 'KG', 'price': 900.0}), ('Thyme Fresh', {'category': 'Exotic', 'unit': 'KG', 'price': 300.0}), ('Turmeric Fresh', {'category': 'Exotic', 'unit': 'KG', 'price': 150.0}), ('Turnip', {'category': 'Exotic', 'unit': 'KG', 'price': 100.0}), ('Wild Roquette/Aragula', {'category': 'Exotic', 'unit': 'KG', 'price': 900.0}), ('Zucchini Green', {'category': 'Exotic', 'unit': 'KG', 'price': 120.0}), ('Zucchini Yellow', {'category': 'Exotic', 'unit': 'KG', 'price': 120.0}), ('Red/Green Lettuce', {'category': 'Exotic', 'unit': 'KG', 'price': 100.0}), ('Garlic China Big', {'category': 'Exotic', 'unit': 'KG', 'price': 350.0}), ('Garlic China Peeled', {'category': 'Exotic', 'unit': 'KG', 'price': 450.0}), ('Lettuce Mix Clean', {'category': 'Exotic', 'unit': 'KG', 'price': 300.0}), ('Bean Sprouts', {'category': 'Vegetables', 'unit': 'Box', 'price': 60.0}), ('Babycorn Peeled', {'category': 'Vegetables', 'unit': 'KG', 'price': 100.0}), ('Sprouts (Moong/Mixed)', {'category': 'Vegetables', 'unit': 'KG', 'price': 60.0}), ('Sweetcorn Peeled Fresh', {'category': 'Vegetables', 'unit': 'KG', 'price': 130.0}), ('Mushrooms Button White', {'category': 'Vegetables', 'unit': 'KG', 'price': 210.0}), ('Mushroom Enoki', {'category': 'Vegetables', 'unit': 'Packet', 'price': 240.0}), ('Mushroom Oyster', {'category': 'Vegetables', 'unit': 'KG', 'price': 250.0}), ('Mushroom Milky White', {'category': 'Vegetables', 'unit': 'Packet', 'price': 150.0}), ('Mushroom Portobello (Import)', {'category': 'Vegetables', 'unit': 'Packet', 'price': 150.0}), ('Mushroom Shimeji', {'category': 'Vegetables', 'unit': 'Packet', 'price': 150.0}), ('Microgreens', {'category': 'Vegetables', 'unit': 'Box', 'price': 200.0}), ('Wheatgrass', {'category': 'Vegetables', 'unit': 'Packet', 'price': 200.0}), ('Amla', {'category': 'Fruits', 'unit': 'KG', 'price': 80.0}), ('Apple Red', {'category': 'Fruits', 'unit': 'KG', 'price': 200.0}), ('Apple Green', {'category': 'Fruits', 'unit': 'KG', 'price': 280.0}), ('Avacado Imp', {'category': 'Fruits', 'unit': 'KG', 'price': 200.0}), ('Avacado/Butterfruit Local', {'category': 'Fruits', 'unit': 'KG', 'price': 220.0}), ('Banana Small/Elachai', {'category': 'Fruits', 'unit': 'KG', 'price': 70.0}), ('Banana Robusta', {'category': 'Fruits', 'unit': 'KG', 'price': 45.0}), ('Blueberry', {'category': 'Fruits', 'unit': 'Box', 'price': 200.0}), ('Chickoo/Sapota', {'category': 'Fruits', 'unit': 'KG', 'price': 70.0}), ('Coconut Tender', {'category': 'Fruits', 'unit': 'Piece', 'price': 75.0}), ('Cherry Imp', {'category': 'Fruits', 'unit': 'KG', 'price': 150.0}), ('Custard Apple', {'category': 'Fruits', 'unit': 'KG', 'price': 150.0}), ('Dragonfruit Red/White', {'category': 'Fruits', 'unit': 'KG', 'price': 180.0}), ('Fig', {'category': 'Fruits', 'unit': 'Box', 'price': 150.0}), ('Grapes Blue/Black Local', {'category': 'Fruits', 'unit': 'KG', 'price': 100.0}), ('Grapes Red Globe/Imp', {'category': 'Fruits', 'unit': 'KG', 'price': 380.0}), ('Grapes Green', {'category': 'Fruits', 'unit': 'KG', 'price': 120.0}), ('Grapefruit Imp', {'category': 'Fruits', 'unit': 'KG', 'price': 350.0}), ('Guava', {'category': 'Fruits', 'unit': 'KG', 'price': 80.0}), ('Jackfruit Ripe', {'category': 'Fruits', 'unit': 'KG', 'price': 150.0}), ('Lime Seedless', {'category': 'Fruits', 'unit': 'KG', 'price': 90.0}), ('Kaffir Lime', {'category': 'Fruits', 'unit': 'KG', 'price': 1400.0}), ('Kiwi Fruit', {'category': 'Fruits', 'unit': 'Piece', 'price': 45.0}), ('Litchi / Longan', {'category': 'Fruits', 'unit': 'KG', 'price': 150.0}), ('Mango Alphanso Season Only', {'category': 'Fruits', 'unit': 'KG', 'price': 150.0}), ('Mango Raw Totapuri', {'category': 'Fruits', 'unit': 'KG', 'price': 120.0}), ('Mango Raw', {'category': 'Fruits', 'unit': 'KG', 'price': 150.0}), ('Musk Melon', {'category': 'Fruits', 'unit': 'KG', 'price': 40.0}), ('Orange Citrus Imp', {'category': 'Fruits', 'unit': 'KG', 'price': 180.0}), ('Orange Nagpur', {'category': 'Fruits', 'unit': 'KG', 'price': 90.0}), ('Orange Sweet /Mandarin', {'category': 'Fruits', 'unit': 'KG', 'price': 140.0}), ('Persimmon', {'category': 'Fruits', 'unit': 'KG', 'price': 150.0}), ('Papaya', {'category': 'Fruits', 'unit': 'KG', 'price': 45.0}), ('Pears Imp', {'category': 'Fruits', 'unit': 'KG', 'price': 320.0}), ('Pineapple', {'category': 'Fruits', 'unit': 'KG', 'price': 65.0}), ('Passion Fruit', {'category': 'Fruits', 'unit': 'KG', 'price': 300.0}), ('Plums', {'category': 'Fruits', 'unit': 'KG', 'price': 150.0}), ('Rambutan', {'category': 'Fruits', 'unit': 'KG', 'price': 150.0}), ('Pomegranate', {'category': 'Fruits', 'unit': 'KG', 'price': 180.0}), ('Strawberry', {'category': 'Fruits', 'unit': 'Box', 'price': 150.0}), ('Sweet Lime/Mosambi', {'category': 'Fruits', 'unit': 'KG', 'price': 80.0}), ('Watermelon Kiran', {'category': 'Fruits', 'unit': 'KG', 'price': 30.0}), ('Watermelon Regular', {'category': 'Fruits', 'unit': 'KG', 'price': 150.0}), ('Arbi/Taro Root', {'category': 'Vegetables', 'unit': 'KG', 'price': 90.0}), ('Avarekai Peeled', {'category': 'Vegetables', 'unit': 'KG', 'price': 280.0}), ('Banana Leaf Big', {'category': 'Vegetables', 'unit': 'Piece', 'price': 7.0}), ('Banana Flower', {'category': 'Vegetables', 'unit': 'Piece', 'price': 30.0}), ('Banana Raw', {'category': 'Vegetables', 'unit': 'KG', 'price': 60.0}), ('Banana Stem', {'category': 'Vegetables', 'unit': 'Piece', 'price': 30.0}), ('Beans Nati/Local', {'category': 'Vegetables', 'unit': 'KG', 'price': 45.0}), ('Beans Long', {'category': 'Vegetables', 'unit': 'KG', 'price': 60.0}), ('Beetroot', {'category': 'Vegetables', 'unit': 'KG', 'price': 40.0}), ('Brinjal Long Black/Green', {'category': 'Vegetables', 'unit': 'KG', 'price': 40.0}), ('Brinjal Round Black/Green', {'category': 'Vegetables', 'unit': 'KG', 'price': 40.0}), ('Cabbage White', {'category': 'Vegetables', 'unit': 'KG', 'price': 25.0}), ('Capsium Green', {'category': 'Vegetables', 'unit': 'KG', 'price': 55.0}), ('Carrot Ooty/Regular Big', {'category': 'Vegetables', 'unit': 'KG', 'price': 65.0}), ('Cauliflower', {'category': 'Vegetables', 'unit': 'KG', 'price': 40.0}), ('Chow Chow', {'category': 'Vegetables', 'unit': 'KG', 'price': 35.0}), ('Chilli Green Reg', {'category': 'Vegetables', 'unit': 'KG', 'price': 60.0}), ('Chilli Green Spicy', {'category': 'Vegetables', 'unit': 'KG', 'price': 70.0}), ('Chilli Red', {'category': 'Vegetables', 'unit': 'KG', 'price': 110.0}), ('Chilli Bajji', {'category': 'Vegetables', 'unit': 'KG', 'price': 50.0}), ('Coccinia/ Ivy Gourd', {'category': 'Vegetables', 'unit': 'KG', 'price': 40.0}), ('Coconut Big', {'category': 'Vegetables', 'unit': 'Piece', 'price': 45.0}), ('Cucumber Local', {'category': 'Vegetables', 'unit': 'KG', 'price': 35.0}), ('Cucumber White', {'category': 'Vegetables', 'unit': 'KG', 'price': 50.0}), ('Drumstick', {'category': 'Vegetables', 'unit': 'KG', 'price': 120.0}), ('Garlic Whole Ind', {'category': 'Vegetables', 'unit': 'KG', 'price': 120.0}), ('Garlic Peeled', {'category': 'Vegetables', 'unit': 'KG', 'price': 150.0}), ('Ginger', {'category': 'Vegetables', 'unit': 'KG', 'price': 90.0}), ('Gourd Bitter', {'category': 'Vegetables', 'unit': 'KG', 'price': 40.0}), ('Gourd Ash', {'category': 'Vegetables', 'unit': 'KG', 'price': 30.0}), ('Gourd Ridge', {'category': 'Vegetables', 'unit': 'KG', 'price': 40.0}), ('Gourd Snake', {'category': 'Vegetables', 'unit': 'KG', 'price': 40.0}), ('Gourd Bottle', {'category': 'Vegetables', 'unit': 'KG', 'price': 30.0}), ('Green Peas Fresh', {'category': 'Vegetables', 'unit': 'KG', 'price': 150.0}), ('Jackfruit Raw Baby', {'category': 'Vegetables', 'unit': 'KG', 'price': 80.0}), ('Knol Khol', {'category': 'Vegetables', 'unit': 'KG', 'price': 40.0}), ('Leafy Corriander', {'category': 'Vegetables', 'unit': 'KG', 'price': 70.0}), ('Leafy Curry', {'category': 'Vegetables', 'unit': 'KG', 'price': 120.0}), ('Leafy Dill', {'category': 'Vegetables', 'unit': 'KG', 'price': 90.0}), ('Leafy Methi/Fenugreek', {'category': 'Vegetables', 'unit': 'KG', 'price': 80.0}), ('Leafy Mint', {'category': 'Vegetables', 'unit': 'KG', 'price': 60.0}), ('Leafy Palak/Spinach', {'category': 'Vegetables', 'unit': 'KG', 'price': 70.0}), ('Leafy Amaranthus', {'category': 'Vegetables', 'unit': 'KG', 'price': 60.0}), ('Leafy Drumstick', {'category': 'Vegetables', 'unit': 'KG', 'price': 100.0}), ('Leafy Mix', {'category': 'Vegetables', 'unit': 'KG', 'price': 50.0}), ('Lemon Green/Yellow Big', {'category': 'Vegetables', 'unit': 'KG', 'price': 90.0}), ('Okra/Lady Finger', {'category': 'Vegetables', 'unit': 'KG', 'price': 40.0}), ('Onion Regular', {'category': 'Vegetables', 'unit': 'KG', 'price': 45.0}), ('Onion Sambar/Shallots', {'category': 'Vegetables', 'unit': 'KG', 'price': 60.0}), ('Onion White', {'category': 'Vegetables', 'unit': 'KG', 'price': 60.0}), ('Potato Regular', {'category': 'Vegetables', 'unit': 'KG', 'price': 28.0}), ('Potato Sweet', {'category': 'Vegetables', 'unit': 'KG', 'price': 60.0}), ('Pumpkin Red/Yellow', {'category': 'Vegetables', 'unit': 'KG', 'price': 30.0}), ('Parwal/Point Gourd', {'category': 'Vegetables', 'unit': 'KG', 'price': 120.0}), ('Radish White', {'category': 'Vegetables', 'unit': 'KG', 'price': 40.0}), ('Tomato Local/Nati', {'category': 'Vegetables', 'unit': 'KG', 'price': 35.0}), ('Tomato Jam/Hybrid Big', {'category': 'Vegetables', 'unit': 'KG', 'price': 35.0}), ('Tapioca', {'category': 'Vegetables', 'unit': 'KG', 'price': 60.0}), ('Yam', {'category': 'Vegetables', 'unit': 'KG', 'price': 50.0}), ('Papaya Raw', {'category': 'Vegetables', 'unit': 'KG', 'price': 45.0}), ('Manglore Cucumber', {'category': 'Vegetables', 'unit': 'KG', 'price': 30.0}), ('Zucchini  Yellow', {'category': 'Exotic', 'unit': 'KG', 'price': 120.0}), ('Green Chilli Spicy', {'category': 'Vegetables', 'unit': 'KG', 'price': 60.0}), ('Palak/Spinach', {'category': 'Leafy', 'unit': 'KG', 'price': 50.0}), ('Peeled Garlic', {'category': 'Vegetables', 'unit': 'KG', 'price': 250.0}), ('Carrot', {'category': 'Vegetables', 'unit': 'KG', 'price': 55.0}), ('Beans Haricot', {'category': 'Vegetables', 'unit': 'KG', 'price': 60.0}), ('Red Chilli', {'category': 'Vegetables', 'unit': 'KG', 'price': 150.0}), ('Basil Leaves', {'category': 'Exotic', 'unit': 'KG', 'price': 130.0}), ('Potato', {'category': 'Vegetables', 'unit': 'KG', 'price': 30.0}), ('Mushroom Button', {'category': 'Exotic', 'unit': 'Packet', 'price': 40.0}), ('Sweet Corn', {'category': 'Vegetables', 'unit': 'Piece', 'price': 20.0}), ('Onion', {'category': 'Vegetables', 'unit': 'KG', 'price': 35.0}), ('Tomato Jam', {'category': 'Vegetables', 'unit': 'KG', 'price': 30.0}), ('Capsicum  Green', {'category': 'Vegetables', 'unit': 'KG', 'price': 45.0}), ('Banana Leaf', {'category': 'Vegetables', 'unit': 'Piece', 'price': 5.0}), ('Capsicum  Yellow', {'category': 'Vegetables', 'unit': 'KG', 'price': 125.0}), ('Pokkchoy', {'category': 'Vegetables', 'unit': 'KG', 'price': 90.0}), ('Bottle Guard', {'category': 'Vegetables', 'unit': 'KG', 'price': 45.0}), ('Long Beans', {'category': 'Vegetables', 'unit': 'KG', 'price': 70.0}), ('Baby Corn', {'category': 'Exotic', 'unit': 'KG', 'price': 120.0}), ('Coconut Pc', {'category': 'Vegetables', 'unit': 'Piece', 'price': 30.0}), ('Curry Leaves', {'category': 'Vegetables', 'unit': 'KG', 'price': 40.0}), ('Lemon Green', {'category': 'Vegetables', 'unit': 'KG', 'price': 150.0}), ('Mint', {'category': 'Leafy', 'unit': 'KG', 'price': 50.0}), ('Coriander', {'category': 'Leafy', 'unit': 'KG', 'price': 60.0}), ('Pineapple Kg', {'category': 'Vegetables', 'unit': 'KG', 'price': 65.0}), ('Lemon  Yellow', {'category': 'Vegetables', 'unit': 'KG', 'price': 150.0}), ('Grapefruit', {'category': 'Vegetables', 'unit': 'KG', 'price': 350.0}), ('Spring Onion', {'category': 'Vegetables', 'unit': 'KG', 'price': 60.0}), ('Orange', {'category': 'Vegetables', 'unit': 'KG', 'price': 170.0}), ('Red Apple', {'category': 'Vegetables', 'unit': 'KG', 'price': 280.0}), ('Cucumber', {'category': 'Vegetables', 'unit': 'KG', 'price': 48.0}), ('Green Capsicum', {'category': 'Vegetables', 'unit': 'KG', 'price': 100.0}), ('Ladies Finger', {'category': 'Vegetables', 'unit': 'KG', 'price': 49.0}), ('Red Capsicum', {'category': 'Vegetables', 'unit': 'KG', 'price': 240.0}), ('Watermelon Pc', {'category': 'Vegetables', 'unit': 'Piece', 'price': 130.0}), ('Pumpkin', {'category': 'Vegetables', 'unit': 'KG', 'price': 20.0}), ('Green  Lettuce', {'category': 'Leafy', 'unit': 'KG', 'price': 115.0}), ('Asparagus', {'category': 'Vegetables', 'unit': 'KG', 'price': 300.0}), ('American Corn', {'category': 'Vegetables', 'unit': 'KG', 'price': 85.0}), ('Black Grapes', {'category': 'Vegetables', 'unit': 'KG', 'price': 400.0}), ('Thyme', {'category': 'Exotic', 'unit': 'KG', 'price': 325.0}), ('Delivery', {'category': 'Vegetables', 'unit': 'KG', 'price': 600.0}), ('Watermelon', {'category': 'Vegetables', 'unit': 'KG', 'price': 25.0}), ('English Cucumber', {'category': 'Vegetables', 'unit': 'KG', 'price': 80.0}), ('Cabbage', {'category': 'Vegetables', 'unit': 'KG', 'price': 45.0}), ('Garlic Whole', {'category': 'Vegetables', 'unit': 'KG', 'price': 165.0}), ('Parsley', {'category': 'Exotic', 'unit': 'KG', 'price': 180.0}), ('Cherry Tomato', {'category': 'Vegetables', 'unit': 'KG', 'price': 320.0}), ('Methi Leaf', {'category': 'Leafy', 'unit': 'KG', 'price': 150.0}), ('Sorrel Leaves', {'category': 'Vegetables', 'unit': 'KG', 'price': 100.0}), ('Pumpkin Pc', {'category': 'Vegetables', 'unit': 'Piece', 'price': 95.0}), ('Red Lettuce', {'category': 'Leafy', 'unit': 'KG', 'price': 320.0}), ('Pears', {'category': 'Vegetables', 'unit': 'KG', 'price': 380.0}), ('Raw Mango', {'category': 'Vegetables', 'unit': 'KG', 'price': 120.0}), ('Green Apple', {'category': 'Vegetables', 'unit': 'KG', 'price': 270.0}), ('Palak', {'category': 'Leafy', 'unit': 'KG', 'price': 85.0}), ('Rosemary', {'category': 'Exotic', 'unit': 'KG', 'price': 325.0}), ('Dragon Fruit Pink', {'category': 'Vegetables', 'unit': 'Piece', 'price': 120.0}), ('Baby Jack Fruit', {'category': 'Exotic', 'unit': 'KG', 'price': 80.0}), ("Lady'S Finger", {'category': 'Vegetables', 'unit': 'KG', 'price': 49.0}), ('Bottle Gourd', {'category': 'Vegetables', 'unit': 'KG', 'price': 60.0}), ('Egg Plant', {'category': 'Vegetables', 'unit': 'KG', 'price': 70.0}), ('Bajji Chilli', {'category': 'Vegetables', 'unit': 'KG', 'price': 50.0}), ('Green Peas', {'category': 'Vegetables', 'unit': 'KG', 'price': 90.0}), ('Bitter Gourd', {'category': 'Vegetables', 'unit': 'KG', 'price': 60.0}), ('Vanilla Ice-Cream', {'category': 'Vegetables', 'unit': 'KG', 'price': 80.0}), ('Pista Ice-Cream', {'category': 'Vegetables', 'unit': 'KG', 'price': 80.0}), ('Point Gourd', {'category': 'Vegetables', 'unit': 'KG', 'price': 150.0}), ('Thai Ginger', {'category': 'Vegetables', 'unit': 'KG', 'price': 300.0}), ('Snake Gaurd', {'category': 'Vegetables', 'unit': 'KG', 'price': 45.0}), ('Lemon Grass', {'category': 'Vegetables', 'unit': 'KG', 'price': 110.0}), ('Banana', {'category': 'Vegetables', 'unit': 'KG', 'price': 40.0}), ('Kaffir Lime Leaves Pack', {'category': 'Vegetables', 'unit': 'Packet', 'price': 200.0}), ('Papaya Pc', {'category': 'Vegetables', 'unit': 'Piece', 'price': 85.0}), ('Kaffir Lime Leaves', {'category': 'Vegetables', 'unit': 'KG', 'price': 1400.0}), ('Brinjal', {'category': 'Vegetables', 'unit': 'KG', 'price': 50.0}), ('Cauliflower Pc', {'category': 'Vegetables', 'unit': 'Piece', 'price': 30.0}), ('Mango Alphonso', {'category': 'Vegetables', 'unit': 'KG', 'price': 250.0}), ('Mango Ripe', {'category': 'Vegetables', 'unit': 'KG', 'price': 120.0}), ('Avacado Impo', {'category': 'Vegetables', 'unit': 'KG', 'price': 530.0}), ('Turmeric', {'category': 'Vegetables', 'unit': 'KG', 'price': 150.0}), ('Sambar Onion', {'category': 'Vegetables', 'unit': 'KG', 'price': 70.0}), ('Iceberg', {'category': 'Vegetables', 'unit': 'KG', 'price': 260.0}), ('Ridge Gourd', {'category': 'Vegetables', 'unit': 'KG', 'price': 60.0}), ('Kiwi', {'category': 'Vegetables', 'unit': 'KG', 'price': 280.0}), ('Mushroom', {'category': 'Exotic', 'unit': 'KG', 'price': 200.0}), ('Haricot Beans', {'category': 'Vegetables', 'unit': 'KG', 'price': 130.0}), ('Indian Cucumber', {'category': 'Vegetables', 'unit': 'KG', 'price': 25.0}), ('Celery Stem', {'category': 'Exotic', 'unit': 'KG', 'price': 135.0}), ('Maggi  Masala', {'category': 'Vegetables', 'unit': 'Packet', 'price': 60.0}), ('Ashirvad Atta', {'category': 'Vegetables', 'unit': 'KG', 'price': 60.0}), ('Avacado Impo Box', {'category': 'Vegetables', 'unit': 'Box', 'price': 1550.0}), ('Enoki Mushroom', {'category': 'Exotic', 'unit': 'KG', 'price': 1500.0}), ('Bisleri', {'category': 'Vegetables', 'unit': 'Box', 'price': 190.0}), ('Raspuri Mango', {'category': 'Vegetables', 'unit': 'KG', 'price': 150.0}), ('Maggi Noodles 850Gm', {'category': 'Vegetables', 'unit': 'Packet', 'price': 160.0}), ('Lemon', {'category': 'Vegetables', 'unit': 'KG', 'price': 220.0}), ('Tomato', {'category': 'Vegetables', 'unit': 'KG', 'price': 35.0}), ('Avocado Imported', {'category': 'Exotic', 'unit': 'KG', 'price': 500.0}), ('Green Chilly', {'category': 'Vegetables', 'unit': 'KG', 'price': 80.0}), ('Egg', {'category': 'Vegetables', 'unit': 'Piece', 'price': 6.5}), ('Dragon Fruit', {'category': 'Vegetables', 'unit': 'Piece', 'price': 80.0}), ('Rocket Lettuce', {'category': 'Leafy', 'unit': 'KG', 'price': 100.0}), ('Sweet  Potato', {'category': 'Vegetables', 'unit': 'KG', 'price': 35.0}), ('Edible Flower', {'category': 'Vegetables', 'unit': 'Box', 'price': 200.0}), ('Dill Leaves', {'category': 'Vegetables', 'unit': 'KG', 'price': 45.0}), ('Bisleri 250Ml', {'category': 'Vegetables', 'unit': 'Box', 'price': 110.0}), ('Ash Gourd', {'category': 'Vegetables', 'unit': 'KG', 'price': 20.0}), ('Raw Banana', {'category': 'Vegetables', 'unit': 'KG', 'price': 33.0}), ('Amaranthus', {'category': 'Vegetables', 'unit': 'KG', 'price': 60.0}), ('Rose  Petals', {'category': 'Vegetables', 'unit': 'KG', 'price': 200.0}), ('Aragula Lettuce', {'category': 'Leafy', 'unit': 'KG', 'price': 120.0}), ('Kiwi Fruit Box', {'category': 'Vegetables', 'unit': 'Box', 'price': 165.0}), ('Tender Coconut Malai', {'category': 'Vegetables', 'unit': 'Piece', 'price': 70.0}), ('Moong Sprouts', {'category': 'Vegetables', 'unit': 'Box', 'price': 40.0}), ('Figs', {'category': 'Vegetables', 'unit': 'Box', 'price': 90.0}), ('Saag Red', {'category': 'Vegetables', 'unit': 'KG', 'price': 55.0}), ('Arbi', {'category': 'Vegetables', 'unit': 'KG', 'price': 35.0}), ('Malbar Palak', {'category': 'Leafy', 'unit': 'KG', 'price': 70.0}), ('Mustard Microgreens', {'category': 'Vegetables', 'unit': 'Box', 'price': 180.0}), ('Radish Microgreens', {'category': 'Vegetables', 'unit': 'Box', 'price': 180.0}), ('Garlic', {'category': 'Vegetables', 'unit': 'KG', 'price': 156.0}), ('Sweet Lime', {'category': 'Vegetables', 'unit': 'KG', 'price': 45.0}), ('Ivy Gourd', {'category': 'Vegetables', 'unit': 'KG', 'price': 50.0}), ('Sambar Onion Peeled', {'category': 'Vegetables', 'unit': 'KG', 'price': 70.0}), ('Avarekai', {'category': 'Vegetables', 'unit': 'KG', 'price': 75.0}), ('Lemon Yellow', {'category': 'Vegetables', 'unit': 'KG', 'price': 90.0}), ('Sugarcane', {'category': 'Vegetables', 'unit': 'Piece', 'price': 25.0}), ('Lotus Root ( Impo)', {'category': 'Vegetables', 'unit': 'KG', 'price': 1540.0}), ('Drumstick Leaves', {'category': 'Vegetables', 'unit': 'KG', 'price': 250.0}), ('Orchid Flower', {'category': 'Vegetables', 'unit': 'Piece', 'price': 130.0}), ('Dragon Fruit White', {'category': 'Vegetables', 'unit': 'Piece', 'price': 90.0}), ('Raspberry', {'category': 'Vegetables', 'unit': 'Box', 'price': 150.0}), ('Red Graphes', {'category': 'Vegetables', 'unit': 'KG', 'price': 300.0}), ('Rosemary Petals', {'category': 'Exotic', 'unit': 'KG', 'price': 100.0}), ('Raw Papaya Pc', {'category': 'Vegetables', 'unit': 'Piece', 'price': 42.0}), ('Avacado Local', {'category': 'Vegetables', 'unit': 'KG', 'price': 200.0}), ('Khol Khol', {'category': 'Vegetables', 'unit': 'KG', 'price': 35.0}), ('Green Chilly Big', {'category': 'Vegetables', 'unit': 'KG', 'price': 70.0}), ('Gaint Aurm', {'category': 'Vegetables', 'unit': 'KG', 'price': 45.0}), ('Coconut', {'category': 'Vegetables', 'unit': 'KG', 'price': 80.0})]

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # 1. Admin Users
    for admin_email in ["admin@freshflow.local", "admin@freshflow.com"]:
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                email=admin_email,
                password_hash=get_password_hash("admin123"),
                role="ADMIN"
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
        else:
            admin.password_hash = get_password_hash("admin123")
            db.commit()

    # 2. Settings
    settings = db.query(Settings).first()
    if not settings:
        settings = Settings(
            company_name="FreshFlow Wholesale Produce",
            address="45 Market Yard, Bangalore",
            phone="+919876543200",
            email="support@freshflow.local",
            gstin="29AAACF1234F1Z0",
            invoice_prefix="FF",
            invoice_counter=1000,
            currency="INR",
            bank_name="HDFC Bank",
            account_number="50200012345678",
            ifsc_code="HDFC0001234",
            upi_id="freshflow@hdfc"
        )
        db.add(settings)
        db.commit()

    # 3. Products (All Extracted Price Quotation & Sales Catalog Items)
    created_products = []
    for name, meta in REAL_PRODUCTS:
        prod = db.query(Product).filter(Product.name == name).first()
        if not prod:
            prod = Product(
                name=name,
                category=meta["category"],
                unit=meta["unit"],
                default_price=Decimal(str(meta["price"])),
                stock_quantity=Decimal("1000.0"),
                reorder_level=Decimal("20.0"),
                is_active=True
            )
            db.add(prod)
            db.commit()
            db.refresh(prod)
        else:
            prod.default_price = Decimal(str(meta["price"]))
            prod.unit = meta["unit"]
            prod.category = meta["category"]
            db.commit()
        created_products.append(prod)
    print(f"Seeded {len(created_products)} produce quotation catalog items.")

    # 4. Customers with linked unique User accounts
    created_customers = []
    for idx, c_name in enumerate(REAL_CUSTOMERS):
        cust = db.query(Customer).filter(Customer.restaurant_name == c_name).first()
        if not cust:
            email = "chef@demo.com" if idx == 0 else f"chef{idx+1}@freshflow.com"
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    email=email,
                    password_hash=get_password_hash("chef123"),
                    role="CUSTOMER"
                )
                db.add(user)
                db.commit()
                db.refresh(user)

            cust = Customer(
                user_id=user.id,
                restaurant_name=c_name,
                gst_number=f"29ABCDE123{idx}F1Z5",
                phone=f"+91980000000{idx+1}",
                address=f"Building #{10+idx}, Indiranagar, Bangalore",
                credit_days=15
            )
            db.add(cust)
            db.commit()
            db.refresh(cust)
        created_customers.append(cust)
    print(f"Seeded {len(created_customers)} restaurant customers.")

    # 5. Suppliers
    suppliers_data = [
        {"name": "Leafy & Herbs Mandi", "phone": "+919876543201", "whatsapp_number": "+919876543201", "email": "herbs@mandi.com", "credit_days": 7, "average_lead_time": 1, "notes": "Supplies fresh spinach, cilantro, basil & mint"},
        {"name": "Exotic Greenhouse Produce", "phone": "+919876543202", "whatsapp_number": "+919876543202", "email": "exotics@greenhouse.com", "credit_days": 15, "average_lead_time": 2, "notes": "Supplies zucchini, mushrooms, bell peppers"},
        {"name": "Global Vegetable Staples", "phone": "+919876543203", "whatsapp_number": "+919876543203", "email": "staples@global.com", "credit_days": 30, "average_lead_time": 1, "notes": "Supplies onion, potato, tomato, garlic"},
    ]

    created_suppliers = []
    for s in suppliers_data:
        sup = db.query(Supplier).filter(Supplier.name == s["name"]).first()
        if not sup:
            sup = Supplier(
                name=s["name"],
                phone=s["phone"],
                whatsapp_number=s["whatsapp_number"],
                email=s["email"],
                credit_days=s["credit_days"],
                average_lead_time=s["average_lead_time"],
                notes=s["notes"]
            )
            db.add(sup)
            db.commit()
            db.refresh(sup)
        created_suppliers.append(sup)
    print(f"Seeded {len(created_suppliers)} suppliers.")

    # 6. Product Supplier Links
    leaf_sup, exotic_sup, staple_sup = created_suppliers[0], created_suppliers[1], created_suppliers[2]
    for prod in created_products:
        link = db.query(ProductSupplier).filter(ProductSupplier.product_id == prod.id).first()
        if not link:
            if prod.category == "Leafy":
                sup = leaf_sup
                margin = Decimal("0.70")
            elif prod.category == "Exotic" or prod.category == "Fruits":
                sup = exotic_sup
                margin = Decimal("0.80")
            else:
                sup = staple_sup
                margin = Decimal("0.75")

            cost = round(prod.default_price * margin, 2)
            link = ProductSupplier(
                product_id=prod.id,
                supplier_id=sup.id,
                cost_price=cost,
                is_primary_supplier=True
            )
            db.add(link)
    db.commit()

    # 7. Sample Revenue & COGS Invoice
    existing_invoices = db.query(Invoice).count()
    if existing_invoices == 0 and created_customers and created_products:
        sample_cust = created_customers[0]
        sample_order = Order(
            customer_id=sample_cust.id,
            status="Completed",
            created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=2)
        )
        db.add(sample_order)
        db.commit()
        db.refresh(sample_order)

        total_order_amount = Decimal("0.0")
        for prod in created_products[:5]:
            qty = Decimal("10.0")
            price = prod.default_price
            item_total = qty * price
            total_order_amount += item_total
            db.add(OrderItem(
                order_id=sample_order.id,
                product_id=prod.id,
                quantity=qty,
                unit=prod.unit,
                unit_price=price
            ))
        db.commit()

        inv = Invoice(
            order_id=sample_order.id,
            customer_id=sample_cust.id,
            invoice_number="FF-1001",
            subtotal=total_order_amount,
            gst=Decimal("0.00"),
            grand_total=total_order_amount,
            paid_amount=total_order_amount,
            balance_due=Decimal("0.00"),
            status="Generated",
            payment_status="Paid",
            created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=2)
        )
        db.add(inv)
        db.commit()

        sample_po = PurchaseOrder(
            supplier_id=staple_sup.id,
            triggered_by_order_id=sample_order.id,
            status="Received",
            total_cost=round(total_order_amount * Decimal("0.75"), 2),
            paid_amount=round(total_order_amount * Decimal("0.75"), 2),
            balance_due=Decimal("0.00"),
            payment_status="Paid",
            created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=3)
        )
        db.add(sample_po)
        db.commit()

    db.close()
    print("Full Price Quotation real-data seed complete.")

if __name__ == "__main__":
    seed_db()
