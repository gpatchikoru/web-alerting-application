import { db } from './config/database';

const defaultItems = [
  // Medicine items
  {
    name: 'Paracetamol 500mg',
    description: 'Pain relief tablets',
    current_count: 50,
    low_stock_threshold: 10,
    item_type: 'medicine',
    category: 'pain_relief',
    unit: 'tablets',
    location: 'Medicine Cabinet',
    dosage_form: 'tablet',
    strength: '500mg',
    expiry_date: '2025-12-31',
    manufacturer: 'Generic Pharma',
    prescription_required: false,
    instructions: 'Take 1-2 tablets every 4-6 hours as needed'
  },
  {
    name: 'Vitamin C 1000mg',
    description: 'Immune support supplement',
    current_count: 30,
    low_stock_threshold: 5,
    item_type: 'medicine',
    category: 'vitamins',
    unit: 'tablets',
    location: 'Medicine Cabinet',
    dosage_form: 'tablet',
    strength: '1000mg',
    expiry_date: '2025-10-15',
    manufacturer: 'Health Plus',
    prescription_required: false,
    instructions: 'Take 1 tablet daily with food'
  },
  {
    name: 'Ibuprofen 400mg',
    description: 'Anti-inflammatory pain relief',
    current_count: 8,
    low_stock_threshold: 10,
    item_type: 'medicine',
    category: 'pain_relief',
    unit: 'tablets',
    location: 'Medicine Cabinet',
    dosage_form: 'tablet',
    strength: '400mg',
    expiry_date: '2025-08-20',
    manufacturer: 'Generic Pharma',
    prescription_required: false,
    instructions: 'Take 1-2 tablets every 6-8 hours'
  },
  {
    name: 'Cough Syrup',
    description: 'Dry cough relief',
    current_count: 2,
    low_stock_threshold: 3,
    item_type: 'medicine',
    category: 'cough_cold',
    unit: 'bottles',
    location: 'Medicine Cabinet',
    dosage_form: 'liquid',
    strength: '15ml per dose',
    expiry_date: '2025-06-30',
    manufacturer: 'ColdCare',
    prescription_required: false,
    instructions: 'Take 15ml every 4-6 hours'
  },

  // Kitchen items
  {
    name: 'Rice (Basmati)',
    description: 'Long grain basmati rice',
    current_count: 3,
    low_stock_threshold: 2,
    item_type: 'kitchen',
    category: 'grains',
    unit: 'kg',
    location: 'Pantry',
    expiry_date: '2025-12-31',
    brand: 'Premium Rice Co.',
    nutritional_info: '{"calories": 360, "protein": 7, "carbs": 78, "fat": 1}'
  },
  {
    name: 'Olive Oil',
    description: 'Extra virgin olive oil',
    current_count: 1,
    low_stock_threshold: 2,
    item_type: 'kitchen',
    category: 'condiments',
    unit: 'liters',
    location: 'Pantry',
    expiry_date: '2025-09-15',
    brand: 'Mediterranean Gold',
    nutritional_info: '{"calories": 884, "protein": 0, "carbs": 0, "fat": 100}'
  },
  {
    name: 'Black Pepper',
    description: 'Ground black pepper',
    current_count: 0,
    low_stock_threshold: 1,
    item_type: 'kitchen',
    category: 'spices',
    unit: 'grams',
    location: 'Spice Rack',
    expiry_date: '2025-12-31',
    brand: 'Spice Master',
    nutritional_info: '{"calories": 251, "protein": 10, "carbs": 64, "fat": 3}'
  },
  {
    name: 'Milk (Full Fat)',
    description: 'Fresh whole milk',
    current_count: 2,
    low_stock_threshold: 3,
    item_type: 'kitchen',
    category: 'dairy',
    unit: 'liters',
    location: 'Refrigerator',
    expiry_date: '2025-07-05',
    brand: 'Dairy Fresh',
    nutritional_info: '{"calories": 61, "protein": 3, "carbs": 5, "fat": 3}'
  },
  {
    name: 'Tomatoes',
    description: 'Fresh red tomatoes',
    current_count: 5,
    low_stock_threshold: 3,
    item_type: 'kitchen',
    category: 'vegetables',
    unit: 'pieces',
    location: 'Refrigerator',
    expiry_date: '2025-07-10',
    brand: 'Fresh Farm',
    nutritional_info: '{"calories": 18, "protein": 1, "carbs": 4, "fat": 0}'
  },
  {
    name: 'Bananas',
    description: 'Fresh yellow bananas',
    current_count: 8,
    low_stock_threshold: 5,
    item_type: 'kitchen',
    category: 'fruits',
    unit: 'pieces',
    location: 'Fruit Bowl',
    expiry_date: '2025-07-08',
    brand: 'Tropical Fresh',
    nutritional_info: '{"calories": 89, "protein": 1, "carbs": 23, "fat": 0}'
  }
];

async function seedData() {
  try {
    console.log('🌱 Starting database seeding...');

    // Enable uuid extension
    await db.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ UUID extension enabled');

    // Clear existing data
    await db.query('DELETE FROM alerts');
    await db.query('DELETE FROM inventory_items');
    console.log('✅ Cleared existing data');

    // Insert default items
    for (const item of defaultItems) {
      const query = `
        INSERT INTO inventory_items (
          id, name, description, current_count, low_stock_threshold, item_type, 
          category, unit, location, dosage_form, strength, expiry_date, 
          manufacturer, prescription_required, instructions, brand, nutritional_info
        ) VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id
      `;

      const values = [
        item.name,
        item.description,
        item.current_count,
        item.low_stock_threshold,
        item.item_type,
        item.category,
        item.unit,
        item.location,
        item.dosage_form || null,
        item.strength || null,
        item.expiry_date ? new Date(item.expiry_date) : null,
        item.manufacturer || null,
        item.prescription_required || false,
        item.instructions || null,
        item.brand || null,
        item.nutritional_info ? JSON.stringify(JSON.parse(item.nutritional_info)) : null
      ];

      const result = await db.query(query, values);
      console.log(`✅ Added: ${item.name}`);

      // Create alerts for low stock items
      if (item.current_count <= item.low_stock_threshold) {
        const alertQuery = `
          INSERT INTO alerts (
            id, type, severity, status, title, message, item_id, item_name, item_type,
            current_count, threshold, expiry_date
          ) VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `;

        const alertValues = [
          'low_stock',
          item.current_count === 0 ? 'critical' : 'high',
          'active',
          `Low Stock Alert: ${item.name}`,
          `${item.name} is running low. Current stock: ${item.current_count} ${item.unit}`,
          result.rows[0].id,
          item.name,
          item.item_type,
          item.current_count,
          item.low_stock_threshold,
          item.expiry_date ? new Date(item.expiry_date) : null
        ];

        await db.query(alertQuery, alertValues);
        console.log(`⚠️  Created alert for: ${item.name}`);
      }
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log(`📊 Added ${defaultItems.length} items`);
    
    // Show summary
    const itemCount = await db.query('SELECT COUNT(*) FROM inventory_items');
    const alertCount = await db.query('SELECT COUNT(*) FROM alerts');
    console.log(`📈 Total items in database: ${itemCount.rows[0].count}`);
    console.log(`🚨 Total alerts: ${alertCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await db.close();
  }
}

// Run the seeding
seedData(); 