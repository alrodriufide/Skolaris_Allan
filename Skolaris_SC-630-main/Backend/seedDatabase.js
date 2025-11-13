const mongoose = require('mongoose');
const Usuario = require('./models/usuarioModel');
const Grupo = require('./models/grupoModel');
const Materia = require('./models/materiaModel');
const Grade = require('./models/gradeModel');
const Report = require('./models/reportModel');
const ReadReceipt = require('./models/readReceiptModel');
const Semester = require('./models/semesterModel');
const GradeHistory = require('./models/gradeHistoryModel');
require('dotenv').config();

async function seedDatabase() {
  try {
    // Connect to database
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/skolaris';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await GradeHistory.deleteMany({});
    await ReadReceipt.deleteMany({});
    await Report.deleteMany({});
    await Grade.deleteMany({});
    await Usuario.deleteMany({});
    await Grupo.deleteMany({});
    await Materia.deleteMany({});
    await Semester.deleteMany({});

    console.log('✅ Cleared existing data');

    // 1. Create semesters
    console.log('📅 Creating semesters...');
    const semesters = await Semester.insertMany([
      {
        name: 'Primer',
        year: 2025,
        start_date: new Date('2025-01-15'),
        end_date: new Date('2025-06-30'),
        is_current: true,
        is_active: true
      },
      {
        name: 'Segundo',
        year: 2024,
        start_date: new Date('2024-07-01'),
        end_date: new Date('2024-12-15'),
        is_current: false,
        is_active: true
      },
      {
        name: 'Primer',
        year: 2024,
        start_date: new Date('2024-01-15'),
        end_date: new Date('2024-06-30'),
        is_current: false,
        is_active: false
      }
    ]);
    console.log(`✅ Created ${semesters.length} semesters`);

    // 2. Create subjects
    console.log('📚 Creating subjects...');
    const subjects = await Materia.insertMany([
      { nombre: 'Matemáticas' },
      { nombre: 'Español' },
      { nombre: 'Ciencias' },
      { nombre: 'Estudios Sociales' },
      { nombre: 'Inglés' },
      { nombre: 'Educación Física' },
      { nombre: 'Artes Plásticas' },
      { nombre: 'Música' }
    ]);
    console.log(`✅ Created ${subjects.length} subjects`);

    // 3. Create teachers
    console.log('👩‍🏫 Creating teachers...');
    const teachers = await Usuario.insertMany([
      {
        nombre: 'María',
        apellido: 'González',
        email: 'maria.gonzalez@skolaris.edu',
        contrasena: '$2a$10$rJ8K8q8q8q8q8q8q8q8qO',
        rol: ['Docente'],
        activo: true
      },
      {
        nombre: 'Carlos',
        apellido: 'Rodríguez',
        email: 'carlos.rodriguez@skolaris.edu',
        contrasena: '$2a$10$rJ8K8q8q8q8q8q8q8q8qO',
        rol: ['Docente'],
        activo: true
      },
      {
        nombre: 'Ana',
        apellido: 'Martínez',
        email: 'ana.martinez@skolaris.edu',
        contrasena: '$2a$10$rJ8K8q8q8q8q8q8q8q8qO',
        rol: ['Docente'],
        activo: true
      },
      {
        nombre: 'Luis',
        apellido: 'Hernández',
        email: 'luis.hernandez@skolaris.edu',
        contrasena: '$2a$10$rJ8K8q8q8q8q8q8q8q8qO',
        rol: ['Docente'],
        activo: true
      }
    ]);
    console.log(`✅ Created ${teachers.length} teachers`);

    // 4. Create groups
    console.log('👥 Creating groups...');
    const groups = await Grupo.insertMany([
      {
        nombre: '1A',
        grado: 'Primero',
        cantidad_estudiantes: 25,
        turno: 'Mañana',
        estudiantes: []
      },
      {
        nombre: '1B',
        grado: 'Primero',
        cantidad_estudiantes: 23,
        turno: 'Tarde',
        estudiantes: []
      },
      {
        nombre: '2A',
        grado: 'Segundo',
        cantidad_estudiantes: 22,
        turno: 'Mañana',
        estudiantes: []
      },
      {
        nombre: '2B',
        grado: 'Segundo',
        cantidad_estudiantes: 24,
        turno: 'Tarde',
        estudiantes: []
      }
    ]);
    console.log(`✅ Created ${groups.length} groups`);

    // 5. Create students
    console.log('🎓 Creating students...');
    const studentNames = [
      { nombre: 'Juan', apellido: 'Pérez' },
      { nombre: 'María', apellido: 'López' },
      { nombre: 'Carlos', apellido: 'Gómez' },
      { nombre: 'Ana', apellido: 'Díaz' },
      { nombre: 'Luis', apellido: 'Fernández' },
      { nombre: 'Sofía', apellido: 'Martínez' },
      { nombre: 'Diego', apellido: 'Rodríguez' },
      { nombre: 'Valentina', apellido: 'González' },
      { nombre: 'Andrés', apellido: 'Sánchez' },
      { nombre: 'Camila', apellido: 'Ramírez' },
      { nombre: 'Nicolás', apellido: 'Torres' },
      { nombre: 'Isabella', apellido: 'Flores' },
      { nombre: 'Sebastián', apellido: 'Castillo' },
      { nombre: 'Luciana', apellido: 'Morales' },
      { nombre: 'Mateo', apellido: 'Vargas' },
      { nombre: 'Emma', apellido: 'Silva' },
      { nombre: 'Daniel', apellido: 'Mendoza' },
      { nombre: 'Sara', apellido: 'Reyes' },
      { nombre: 'Gabriel', apellido: 'Jiménez' },
      { nombre: 'Valeria', apellido: 'Muñoz' }
    ];

    const students = await Usuario.insertMany(studentNames.map((student, index) => ({
      ...student,
      email: `${student.nombre.toLowerCase()}.${student.apellido.toLowerCase()}@skolaris.edu`,
      contrasena: '$2a$10$rJ8K8q8q8q8q8q8q8q8qO', // password: "password"
      rol: ['Estudiante'],
      activo: true,
      grupo: groups[index % groups.length]._id,
      grado: groups[index % groups.length].grado
    })));

    // Update groups with student references
    for (let i = 0; i < groups.length; i++) {
      const groupStudents = students.filter((_, index) => index % groups.length === i);
      await Grupo.findByIdAndUpdate(groups[i]._id, {
        $push: { estudiantes: { $each: groupStudents.map(s => s._id) } }
      });
    }

    console.log(`✅ Created ${students.length} students`);

    // 6. Create grades for current semester
    console.log('📊 Creating grades for current semester...');
    const currentSemester = semesters.find(s => s.is_current);
    const grades = [];

    for (const student of students) {
      const studentGroup = groups.find(g => g._id.toString() === student.grupo.toString());

      // Assign subjects based on grade level
      const subjectsForGrade = studentGroup.grado === 'Primero'
        ? subjects.slice(0, 5)  // 5 subjects for first grade
        : subjects.slice(0, 6); // 6 subjects for second grade

      for (const subject of subjectsForGrade) {
        // Assign teacher
        const teacher = teachers[Math.floor(Math.random() * teachers.length)];

        // Generate random grade (65-100)
        const gradeValue = Math.floor(Math.random() * 36) + 65;

        // Generate comments
        const comments = gradeValue >= 90 ? 'Excelente rendimiento' :
                       gradeValue >= 80 ? 'Buen desempeño' :
                       gradeValue >= 70 ? 'Necesita mejorar' :
                       'Requiere atención especial';

        grades.push({
          student_id: student._id,
          teacher_id: teacher._id,
          group_id: studentGroup._id,
          subject_id: subject._id,
          semester_id: currentSemester._id,
          grade_value: gradeValue,
          grade_scale: '0-100',
          comments: Math.random() > 0.5 ? comments : '',
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random time in last 30 days
          updated_at: new Date()
        });
      }
    }

    await Grade.insertMany(grades);
    console.log(`✅ Created ${grades.length} grades`);

    // 7. Create some grades for previous semester
    console.log('📊 Creating grades for previous semester...');
    const previousSemester = semesters.find(s => s.name === 'Segundo' && s.year === 2024);
    const previousGrades = [];

    for (const student of students.slice(0, 10)) { // Only for first 10 students
      const studentGroup = groups.find(g => g._id.toString() === student.grupo.toString());
      const subjectsForGrade = studentGroup.grado === 'Primero'
        ? subjects.slice(0, 4)  // Fewer subjects for previous
        : subjects.slice(0, 5);

      for (const subject of subjectsForGrade) {
        const teacher = teachers[Math.floor(Math.random() * teachers.length)];
        const gradeValue = Math.floor(Math.random() * 36) + 60; // Slightly lower grades

        previousGrades.push({
          student_id: student._id,
          teacher_id: teacher._id,
          group_id: studentGroup._id,
          subject_id: subject._id,
          semester_id: previousSemester._id,
          grade_value: gradeValue,
          grade_scale: '0-100',
          comments: 'Semestre anterior',
          created_at: new Date('2024-11-01'),
          updated_at: new Date('2024-12-01')
        });
      }
    }

    await Grade.insertMany(previousGrades);
    console.log(`✅ Created ${previousGrades.length} previous semester grades`);

    // 8. Create some reports
    console.log('📋 Creating reports...');
    const reports = [];

    // Create reports for current semester
    for (const student of students.slice(0, 15)) { // First 15 students
      const studentGrades = grades.filter(g => g.student_id.toString() === student._id.toString());

      if (studentGrades.length > 0) {
        const average = studentGrades.reduce((sum, g) => sum + g.grade_value, 0) / studentGrades.length;

        reports.push({
          student_id: student._id,
          report_type: 'grades',
          semester_id: currentSemester._id,
          report_data: {
            student: {
              nombre: student.nombre,
              apellido: student.apellido,
              email: student.email,
              grado: student.grado
            },
            semester: {
              name: currentSemester.name,
              year: currentSemester.year,
              start_date: currentSemester.start_date,
              end_date: currentSemester.end_date
            },
            grades: studentGrades.map(g => ({
              subject: subjects.find(s => s._id.toString() === g.subject_id.toString())?.nombre || 'N/A',
              grade: g.grade_value,
              scale: g.grade_scale,
              comments: g.comments,
              teacher: teachers.find(t => t._id.toString() === g.teacher_id.toString())?.nombre || 'N/A',
              created_at: g.created_at
            })),
            generated_at: new Date(),
            total_grades: studentGrades.length,
            average_grade: average.toFixed(2)
          },
          generated_at: new Date(),
          expires_at: moment().add(30, 'days').toDate(),
          is_active: true
        });
      }
    }

    const createdReports = await Report.insertMany(reports);
    console.log(`✅ Created ${createdReports.length} reports`);

    // 9. Create some read receipts
    console.log('✅ Creating read receipts...');
    const readReceipts = [];

    for (let i = 0; i < 8; i++) { // First 8 reports confirmed
      const report = createdReports[i];

      readReceipts.push({
        report_id: report._id,
        user_id: report.student_id,
        read_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        confirmation_method: ['checkbox', 'electronic'][Math.floor(Math.random() * 2)]
      });
    }

    await ReadReceipt.insertMany(readReceipts);
    console.log(`✅ Created ${readReceipts.length} read receipts`);

    // 10. Create some grade history (modifications)
    console.log('📝 Creating grade history...');
    const gradeHistory = [];

    // Find some grades to create history for
    const sampleGrades = await Grade.find({}).limit(10);

    for (const grade of sampleGrades) {
      const oldGrade = grade.grade_value - 5; // Previous grade was 5 points lower
      const changedBy = teachers[Math.floor(Math.random() * teachers.length)];

      gradeHistory.push({
        grade_id: grade._id,
        old_value: oldGrade > 0 ? oldGrade : null,
        new_value: grade.grade_value,
        changed_by: changedBy._id,
        change_reason: 'Corrección de calificación',
        changed_at: new Date(grade.created_at.getTime() + 24 * 60 * 60 * 1000) // 1 day after creation
      });
    }

    await GradeHistory.insertMany(gradeHistory);
    console.log(`✅ Created ${gradeHistory.length} grade history records`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Semesters: ${semesters.length}`);
    console.log(`- Subjects: ${subjects.length}`);
    console.log(`- Teachers: ${teachers.length}`);
    console.log(`- Groups: ${groups.length}`);
    console.log(`- Students: ${students.length}`);
    console.log(`- Grades: ${grades.length + previousGrades.length}`);
    console.log(`- Reports: ${createdReports.length}`);
    console.log(`- Read Receipts: ${readReceipts.length}`);
    console.log(`- Grade History: ${gradeHistory.length}`);

    console.log('\n🔑 Login Credentials:');
    console.log('Email: juan.perez@skolaris.edu (Student) - Password: password');
    console.log('Email: maria.gonzalez@skolaris.edu (Teacher) - Password: password');
    console.log('All users have password: "password"');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeder
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;