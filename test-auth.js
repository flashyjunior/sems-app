require('dotenv').config();

// Test the authentication service directly
(async () => {
  const { PrismaClient } = require('@prisma/client');
  const bcrypt = require('bcryptjs');
  
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing authentication...\n');
    
    const email = 'admin@sems.local';
    const password = 'Admin@123';
    
    console.log('Step 1: Fetching user from database...');
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
    
    if (!user) {
      console.log('❌ User not found in database');
      return;
    }
    
    console.log('✓ User found:');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Full Name:', user.fullName);
    console.log('  Is Active:', user.isActive);
    console.log('  Role:', user.role?.name);
    console.log('  Password hash:', user.password.substring(0, 20) + '...');
    
    console.log('\nStep 2: Checking if user is active...');
    if (!user.isActive) {
      console.log('❌ User is not active');
      return;
    }
    console.log('✓ User is active');
    
    console.log('\nStep 3: Comparing password...');
    const isValid = await bcrypt.compare(password, user.password);
    console.log('Password comparison result:', isValid);
    
    if (!isValid) {
      console.log('❌ Password does not match');
      return;
    }
    
    console.log('✓ Password matches');
    console.log('\n✅ Authentication would succeed!');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
