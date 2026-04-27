export type RouteAudience = 'consumer' | 'developer' | 'business' | 'all';

export type ProductRoute = {
  href: string;
  label: string;
  headerLabel: string;
  isInHeader: boolean;
  isInFooter: boolean;
  audience: RouteAudience;
  primaryCta: string;
  secondaryCta?: string;
  seoIntent?: string;
  conversionGoal?: string;
};

export const productRoutes: ProductRoute[] = [
  {
    href: '/analysis',
    label: 'Analyze Number',
    headerLabel: 'Analyze',
    isInHeader: false,
    isInFooter: true,
    audience: 'consumer',
    primaryCta: 'Analyze a suspicious number',
    conversionGoal: 'start analysis'
  },
  {
    href: '/scams',
    label: 'Scam Intelligence',
    headerLabel: 'Scam Intel',
    isInHeader: true,
    isInFooter: true,
    audience: 'consumer',
    primaryCta: 'Explore scam patterns',
    seoIntent: 'scam protection research',
    conversionGoal: 'scam education to analysis'
  },
  {
    href: '/api-docs',
    label: 'Developer Portal',
    headerLabel: 'Developers',
    isInHeader: true,
    isInFooter: true,
    audience: 'developer',
    primaryCta: 'Start with the API',
    secondaryCta: 'View webhooks',
    conversionGoal: 'developer activation'
  },
  {
    href: '/pricing',
    label: 'Pricing',
    headerLabel: 'Pricing',
    isInHeader: true,
    isInFooter: true,
    audience: 'all',
    primaryCta: 'Choose your plan',
    conversionGoal: 'plan upgrade'
  },
  {
    href: '/security',
    label: 'Security',
    headerLabel: 'Security',
    isInHeader: true,
    isInFooter: true,
    audience: 'business',
    primaryCta: 'View security model',
    conversionGoal: 'trust validation'
  },
  {
    href: '/solutions',
    label: 'Solutions',
    headerLabel: 'Solutions',
    isInHeader: false,
    isInFooter: true,
    audience: 'business',
    primaryCta: 'View solutions',
    conversionGoal: 'sales contact'
  },
  {
    href: '/about',
    label: 'About',
    headerLabel: 'About',
    isInHeader: false,
    isInFooter: true,
    audience: 'all',
    primaryCta: 'Learn about FilterCalls'
  },
  {
    href: '/contact',
    label: 'Contact',
    headerLabel: 'Contact',
    isInHeader: false,
    isInFooter: true,
    audience: 'all',
    primaryCta: 'Get in touch'
  },
  {
    href: '/changelog',
    label: 'Changelog',
    headerLabel: 'Changelog',
    isInHeader: false,
    isInFooter: true,
    audience: 'all',
    primaryCta: "See what's new"
  },
  {
    href: '/insights',
    label: 'Insights',
    headerLabel: 'Insights',
    isInHeader: false,
    isInFooter: true,
    audience: 'all',
    primaryCta: 'View global caller insights'
  }
];

export function getHeaderRoutes(): ProductRoute[] {
  return productRoutes.filter((route) => route.isInHeader);
}

export function getFooterRoutes(): ProductRoute[] {
  return productRoutes.filter((route) => route.isInFooter);
}
