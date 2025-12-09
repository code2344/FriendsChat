const StudentInfo = require('../models/StudentInfo');

/**
 * Initialize or update student information
 * Automatically increments grade level based on the year
 */
async function initializeStudentInfo(userId, firstName, lastName, studentCode, initialGradeLevel) {
  try {
    const currentYear = new Date().getFullYear();
    
    // Check if student info already exists
    let studentInfo = await StudentInfo.findOne({ user: userId });
    
    if (studentInfo) {
      // Update grade level based on years passed
      const yearsPassed = currentYear - studentInfo.initialYear;
      studentInfo.gradeLevel = initialGradeLevel + yearsPassed;
      studentInfo.lastUpdated = Date.now();
      await studentInfo.save();
      console.log(`Student info updated for ${firstName} ${lastName}`);
      return studentInfo;
    }

    // Create new student info
    studentInfo = new StudentInfo({
      user: userId,
      firstName,
      lastName,
      studentCode,
      gradeLevel: initialGradeLevel,
      initialYear: currentYear
    });

    await studentInfo.save();
    console.log(`Student info created for ${firstName} ${lastName}`);
    return studentInfo;
  } catch (error) {
    console.error('Error initializing student info:', error);
    throw error;
  }
}

/**
 * Update all student grade levels based on current year
 */
async function updateAllStudentGrades() {
  try {
    const currentYear = new Date().getFullYear();
    const allStudents = await StudentInfo.find();
    
    for (const student of allStudents) {
      const yearsPassed = currentYear - student.initialYear;
      student.gradeLevel = student.gradeLevel + yearsPassed;
      student.initialYear = currentYear; // Reset initial year
      student.lastUpdated = Date.now();
      await student.save();
    }
    
    console.log('All student grades updated successfully');
  } catch (error) {
    console.error('Error updating student grades:', error);
    throw error;
  }
}

module.exports = {
  initializeStudentInfo,
  updateAllStudentGrades
};
