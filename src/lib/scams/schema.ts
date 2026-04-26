import { getScamPattern, scamPatterns } from './patterns.ts';

const baseUrl = 'https://filtercalls.com';
const isoDate = () => new Date().toISOString().slice(0, 10);

export const getScamsCollectionSchema = (): string => {
  const itemListElement = scamPatterns.map((pattern, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: pattern.shortTitle,
    url: `${baseUrl}/scams/${pattern.slug}`
  }));

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${baseUrl}/scams#collection`,
        url: `${baseUrl}/scams`,
        name: 'Scam Call Playbooks',
        description: 'Actionable playbooks for common scam call patterns.'
      },
      {
        '@type': 'ItemList',
        '@id': `${baseUrl}/scams#itemlist`,
        itemListElement
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${baseUrl}/scams#breadcrumbs`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'Scams', item: `${baseUrl}/scams` }
        ]
      }
    ]
  };

  return JSON.stringify(graph);
};

export const getScamDetailSchema = (slug: string): string => {
  const pattern = getScamPattern(slug);
  if (!pattern) return JSON.stringify({ '@context': 'https://schema.org', '@graph': [] });

  const today = isoDate();
  const url = `${baseUrl}/scams/${pattern.slug}`;

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'HowTo',
        name: `${pattern.shortTitle}: what to do now`,
        description: pattern.summary,
        step: pattern.verificationSteps.slice(0, 5).map((step, index) => ({
          '@type': 'HowToStep',
          position: index + 1,
          text: step
        }))
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `What should I do if this matches ${pattern.shortTitle}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: pattern.bestNextStep
            }
          },
          {
            '@type': 'Question',
            name: 'What should I not share?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: pattern.doNotShare.join(', ')
            }
          }
        ]
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'Scams', item: `${baseUrl}/scams` },
          { '@type': 'ListItem', position: 3, name: pattern.shortTitle, item: url }
        ]
      },
      {
        '@type': 'Article',
        headline: pattern.seoTitle,
        description: pattern.seoDescription,
        datePublished: '2026-01-01',
        dateModified: today,
        lastReviewed: today,
        mainEntityOfPage: url,
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['.what-to-do-now', '.protection-guidance']
        }
      }
    ]
  };

  return JSON.stringify(graph);
};
