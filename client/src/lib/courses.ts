// Course data constants
export const COURSES = [
  {
    id: "web-development",
    name: "Web Development",
    duration: 6,
    fee: 50000,
    description: "Complete web development course covering HTML, CSS, JavaScript, React, and Node.js"
  },
  {
    id: "data-science",
    name: "Data Science",
    duration: 8,
    fee: 75000,
    description: "Comprehensive data science program with Python, machine learning, and analytics"
  },
  {
    id: "digital-marketing",
    name: "Digital Marketing",
    duration: 4,
    fee: 35000,
    description: "Digital marketing strategies, SEO, social media, and campaign management"
  },
  {
    id: "graphic-design",
    name: "Graphic Design",
    duration: 5,
    fee: 40000,
    description: "Creative graphic design with Adobe Creative Suite and design principles"
  },
  {
    id: "mobile-development",
    name: "Mobile Development",
    duration: 7,
    fee: 60000,
    description: "iOS and Android app development with React Native and Flutter"
  }
];

export function getCourseById(id: string) {
  return COURSES.find(course => course.id === id);
}

export function calculateEndDate(startDate: Date, durationMonths: number): Date {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + durationMonths);
  return endDate;
}

export function calculateInstallmentAmount(totalFee: number): number {
  return Math.ceil(totalFee / 3);
}
