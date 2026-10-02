import { CategoryDefinition, EventCategory } from '../types';

export const EVENT_CATEGORIES: EventCategory[] = [
  'Sports & Outdoors',
  'Entertainment & Music',
  'Business & Entrepreneurship',
  'Tech & Innovation',
  'Education & Career',
  'Arts & Culture',
  'Social Impact & Community',
  'Political',
  'Others'
];

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    id: 'all',
    label: 'All Events',
    shortLabel: 'All',
    tagline: 'Every upcoming event on MagiVents across Kenya.',
    description: 'Browse sports, music, business, tech, education, arts, community and civic events happening near you.',
    iconName: 'Compass'
  },
  {
    id: 'Sports & Outdoors',
    label: 'Sports & Outdoors',
    shortLabel: 'Sports',
    tagline: 'Races, matches, hikes and outdoor adventures.',
    description: 'Marathons, football and rugby fixtures, cycling, hikes, camping trips and fitness meet-ups.',
    iconName: 'Trophy'
  },
  {
    id: 'Entertainment & Music',
    label: 'Entertainment & Music',
    shortLabel: 'Music',
    tagline: 'Concerts, festivals, comedy and nightlife.',
    description: 'Live music, festivals, comedy shows, film screenings, theatre and parties.',
    iconName: 'Music'
  },
  {
    id: 'Business & Entrepreneurship',
    label: 'Business & Entrepreneurship',
    shortLabel: 'Business',
    tagline: 'Summits, networking and growth for founders and SMEs.',
    description: 'Business summits, investor pitches, trade fairs, networking evenings and SME workshops.',
    iconName: 'Briefcase'
  },
  {
    id: 'Tech & Innovation',
    label: 'Tech & Innovation',
    shortLabel: 'Tech',
    tagline: 'Hackathons, meetups and conferences.',
    description: 'Developer meetups, hackathons, startup demo days, AI and fintech conferences.',
    iconName: 'Cpu'
  },
  {
    id: 'Education & Career',
    label: 'Education & Career',
    shortLabel: 'Education',
    tagline: 'Learning, training and career growth.',
    description: 'Career fairs, trainings, masterclasses, mentorship sessions and academic forums.',
    iconName: 'GraduationCap'
  },
  {
    id: 'Arts & Culture',
    label: 'Arts & Culture',
    shortLabel: 'Arts',
    tagline: 'Exhibitions, heritage, food and creative showcases.',
    description: 'Art exhibitions, cultural festivals, fashion shows, food fairs, poetry and book launches.',
    iconName: 'Palette'
  },
  {
    id: 'Social Impact & Community',
    label: 'Social Impact & Community',
    shortLabel: 'Community',
    tagline: 'Volunteering, charity and community action.',
    description: 'Clean-ups, tree planting, fundraisers, medical camps, faith and community gatherings.',
    iconName: 'HeartHandshake'
  },
  {
    id: 'Political',
    label: 'Political',
    shortLabel: 'Political',
    tagline: 'Civic forums, town halls and public participation.',
    description: 'Town halls, public participation forums, civic education and leadership debates.',
    iconName: 'Landmark'
  },
  {
    id: 'Others',
    label: 'Others',
    shortLabel: 'Others',
    tagline: 'Everything else worth showing up for.',
    description: 'Events that do not fit the other categories.',
    iconName: 'Shapes'
  }
];
