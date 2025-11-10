// Sample data for testing without MongoDB
const moment = require('moment');

const sampleUsers = [
  // Students
  {
    _id: "student1",
    nombre: "Juan",
    apellido: "Pérez",
    email: "juan.perez@skolaris.edu",
    rol: ["Estudiante"],
    activo: true,
    grado: "Primero",
    grupo: "1A"
  },
  {
    _id: "student2",
    nombre: "María",
    apellido: "López",
    email: "maria.lopez@skolaris.edu",
    rol: ["Estudiante"],
    activo: true,
    grado: "Primero",
    grupo: "1B"
  },
  {
    _id: "student3",
    nombre: "Carlos",
    apellido: "Gómez",
    email: "carlos.gomez@skolaris.edu",
    rol: ["Estudiante"],
    activo: true,
    grado: "Segundo",
    grupo: "2A"
  },
  {
    _id: "student4",
    nombre: "Ana",
    apellido: "Díaz",
    email: "ana.diaz@skolaris.edu",
    rol: ["Estudiante"],
    activo: true,
    grado: "Segundo",
    grupo: "2B"
  },
  {
    _id: "student5",
    nombre: "Luis",
    apellido: "Fernández",
    email: "luis.fernandez@skolaris.edu",
    rol: ["Estudiante"],
    activo: true,
    grado: "Primero",
    grupo: "1A"
  },
  {
    _id: "student6",
    nombre: "Sofía",
    apellido: "Martínez",
    email: "sofia.martinez@skolaris.edu",
    rol: ["Estudiante"],
    activo: true,
    grado: "Primero",
    grupo: "1B"
  },
  {
    _id: "student7",
    nombre: "Diego",
    apellido: "Rodríguez",
    email: "diego.rodriguez@skolaris.edu",
    rol: ["Estudiante"],
    activo: true,
    grado: "Segundo",
    grupo: "2A"
  },
  {
    _id: "student8",
    nombre: "Valentina",
    apellido: "González",
    email: "valentina.gonzalez@skolaris.edu",
    rol: ["Estudiante"],
    activo: true,
    grado: "Segundo",
    grupo: "2B"
  },

  // Teachers
  {
    _id: "teacher1",
    nombre: "María",
    apellido: "González",
    email: "maria.gonzalez@skolaris.edu",
    rol: ["Docente"],
    activo: true
  },
  {
    _id: "teacher2",
    nombre: "Carlos",
    apellido: "Rodríguez",
    email: "carlos.rodriguez@skolaris.edu",
    rol: ["Docente"],
    activo: true
  },
  {
    _id: "teacher3",
    nombre: "Ana",
    apellido: "Martínez",
    email: "ana.martinez@skolaris.edu",
    rol: ["Docente"],
    activo: true
  }
];

const sampleGroups = [
  {
    _id: "group1A",
    nombre: "1A",
    grado: "Primero",
    cantidad_estudiantes: 4,
    turno: "Mañana",
    estudiantes: ["student1", "student5"]
  },
  {
    _id: "group1B",
    nombre: "1B",
    grado: "Primero",
    cantidad_estudiantes: 2,
    turno: "Tarde",
    estudiantes: ["student2", "student6"]
  },
  {
    _id: "group2A",
    nombre: "2A",
    grado: "Segundo",
    cantidad_estudiantes: 2,
    turno: "Mañana",
    estudiantes: ["student3", "student7"]
  },
  {
    _id: "group2B",
    nombre: "2B",
    grado: "Segundo",
    cantidad_estudiantes: 2,
    turno: "Tarde",
    estudiantes: ["student4", "student8"]
  }
];

const sampleSubjects = [
  { _id: "subject1", nombre: "Matemáticas" },
  { _id: "subject2", nombre: "Español" },
  { _id: "subject3", nombre: "Ciencias" },
  { _id: "subject4", nombre: "Estudios Sociales" },
  { _id: "subject5", nombre: "Inglés" },
  { _id: "subject6", nombre: "Educación Física" }
];

const sampleSemesters = [
  {
    _id: "semester1",
    name: "Primer",
    year: 2025,
    start_date: new Date("2025-01-15"),
    end_date: new Date("2025-06-30"),
    is_current: true,
    is_active: true
  },
  {
    _id: "semester2",
    name: "Segundo",
    year: 2024,
    start_date: new Date("2024-07-01"),
    end_date: new Date("2024-12-15"),
    is_current: false,
    is_active: true
  }
];

const sampleGrades = [
  // Current semester grades for student1 (Juan Pérez)
  {
    _id: "grade1",
    student_id: "student1",
    teacher_id: "teacher1",
    group_id: "group1A",
    subject_id: "subject1",
    semester_id: "semester1",
    grade_value: 85,
    grade_scale: "0-100",
    comments: "Buen desempeño en matemáticas",
    created_at: new Date("2025-03-15"),
    updated_at: new Date("2025-03-15")
  },
  {
    _id: "grade2",
    student_id: "student1",
    teacher_id: "teacher2",
    group_id: "group1A",
    subject_id: "subject2",
    semester_id: "semester1",
    grade_value: 92,
    grade_scale: "0-100",
    comments: "Excelente redacción y gramática",
    created_at: new Date("2025-03-16"),
    updated_at: new Date("2025-03-16")
  },
  {
    _id: "grade3",
    student_id: "student1",
    teacher_id: "teacher3",
    group_id: "group1A",
    subject_id: "subject3",
    semester_id: "semester1",
    grade_value: 78,
    grade_scale: "0-100",
    comments: "Necesita mejorar en experimentos",
    created_at: new Date("2025-03-17"),
    updated_at: new Date("2025-03-17")
  },
  {
    _id: "grade4",
    student_id: "student1",
    teacher_id: "teacher1",
    group_id: "group1A",
    subject_id: "subject4",
    semester_id: "semester1",
    grade_value: 88,
    grade_scale: "0-100",
    comments: "Buen conocimiento de historia",
    created_at: new Date("2025-03-18"),
    updated_at: new Date("2025-03-18")
  },
  {
    _id: "grade5",
    student_id: "student1",
    teacher_id: "teacher2",
    group_id: "group1A",
    subject_id: "subject5",
    semester_id: "semester1",
    grade_value: 90,
    grade_scale: "0-100",
    comments: "Buena pronunciación",
    created_at: new Date("2025-03-19"),
    updated_at: new Date("2025-03-19")
  },

  // Current semester grades for student2 (María López)
  {
    _id: "grade6",
    student_id: "student2",
    teacher_id: "teacher3",
    group_id: "group1B",
    subject_id: "subject1",
    semester_id: "semester1",
    grade_value: 95,
    grade_scale: "0-100",
    comments: "Excelente en matemáticas avanzadas",
    created_at: new Date("2025-03-15"),
    updated_at: new Date("2025-03-15")
  },
  {
    _id: "grade7",
    student_id: "student2",
    teacher_id: "teacher1",
    group_id: "group1B",
    subject_id: "subject2",
    semester_id: "semester1",
    grade_value: 87,
    grade_scale: "0-100",
    comments: "Buena comprensión lectora",
    created_at: new Date("2025-03-16"),
    updated_at: new Date("2025-03-16")
  },

  // Previous semester grades for student1
  {
    _id: "grade8",
    student_id: "student1",
    teacher_id: "teacher2",
    group_id: "group1A",
    subject_id: "subject1",
    semester_id: "semester2",
    grade_value: 82,
    grade_scale: "0-100",
    comments: "Semestre anterior",
    created_at: new Date("2024-11-01"),
    updated_at: new Date("2024-11-01")
  },
  {
    _id: "grade9",
    student_id: "student1",
    teacher_id: "teacher3",
    group_id: "group1A",
    subject_id: "subject2",
    semester_id: "semester2",
    grade_value: 90,
    grade_scale: "0-100",
    comments: "Semestre anterior",
    created_at: new Date("2024-11-02"),
    updated_at: new Date("2024-11-02")
  }
];

const sampleReports = [
  {
    _id: "report1",
    student_id: "student1",
    report_type: "grades",
    semester_id: "semester1",
    report_data: {
      student: {
        nombre: "Juan",
        apellido: "Pérez",
        email: "juan.perez@skolaris.edu",
        grado: "Primero"
      },
      semester: {
        name: "Primer",
        year: 2025,
        start_date: new Date("2025-01-15"),
        end_date: new Date("2025-06-30")
      },
      grades: [
        {
          subject: "Matemáticas",
          grade: 85,
          scale: "0-100",
          comments: "Buen desempeño en matemáticas",
          teacher: "María González",
          created_at: new Date("2025-03-15")
        },
        {
          subject: "Español",
          grade: 92,
          scale: "0-100",
          comments: "Excelente redacción y gramática",
          teacher: "Carlos Rodríguez",
          created_at: new Date("2025-03-16")
        },
        {
          subject: "Ciencias",
          grade: 78,
          scale: "0-100",
          comments: "Necesita mejorar en experimentos",
          teacher: "Ana Martínez",
          created_at: new Date("2025-03-17")
        },
        {
          subject: "Estudios Sociales",
          grade: 88,
          scale: "0-100",
          comments: "Buen conocimiento de historia",
          teacher: "María González",
          created_at: new Date("2025-03-18")
        },
        {
          subject: "Inglés",
          grade: 90,
          scale: "0-100",
          comments: "Buena pronunciación",
          teacher: "Carlos Rodríguez",
          created_at: new Date("2025-03-19")
        }
      ],
      generated_at: new Date(),
      total_grades: 5,
      average_grade: "86.60"
    },
    generated_at: new Date(),
    expires_at: moment().add(30, 'days').toDate(),
    is_active: true
  },
  {
    _id: "report2",
    student_id: "student2",
    report_type: "grades",
    semester_id: "semester1",
    report_data: {
      student: {
        nombre: "María",
        apellido: "López",
        email: "maria.lopez@skolaris.edu",
        grado: "Primero"
      },
      semester: {
        name: "Primer",
        year: 2025,
        start_date: new Date("2025-01-15"),
        end_date: new Date("2025-06-30")
      },
      grades: [
        {
          subject: "Matemáticas",
          grade: 95,
          scale: "0-100",
          comments: "Excelente en matemáticas avanzadas",
          teacher: "Ana Martínez",
          created_at: new Date("2025-03-15")
        },
        {
          subject: "Español",
          grade: 87,
          scale: "0-100",
          comments: "Buena comprensión lectora",
          teacher: "María González",
          created_at: new Date("2025-03-16")
        }
      ],
      generated_at: new Date(),
      total_grades: 2,
      average_grade: "91.00"
    },
    generated_at: new Date(),
    expires_at: moment().add(30, 'days').toDate(),
    is_active: true
  }
];

const sampleReadReceipts = [
  {
    _id: "receipt1",
    report_id: "report1",
    user_id: "student1",
    read_at: new Date("2025-11-08T10:30:00"),
    ip_address: "192.168.1.100",
    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    confirmation_method: "checkbox"
  },
  {
    _id: "receipt2",
    report_id: "report2",
    user_id: "student2",
    read_at: new Date("2025-11-09T14:15:00"),
    ip_address: "192.168.1.101",
    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    confirmation_method: "electronic"
  }
];

const sampleGradeHistory = [
  {
    _id: "history1",
    grade_id: "grade1",
    old_value: 80,
    new_value: 85,
    changed_by: "teacher1",
    change_reason: "Corrección de calificación",
    changed_at: new Date("2025-03-16")
  },
  {
    _id: "history2",
    grade_id: "grade2",
    old_value: null,
    new_value: 92,
    changed_by: "teacher2",
    change_reason: "Nueva calificación registrada",
    changed_at: new Date("2025-03-16")
  }
];

module.exports = {
  sampleUsers,
  sampleGroups,
  sampleSubjects,
  sampleSemesters,
  sampleGrades,
  sampleReports,
  sampleReadReceipts,
  sampleGradeHistory
};