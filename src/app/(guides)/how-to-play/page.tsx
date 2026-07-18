import type { Metadata } from 'next';
import { HowToPlayExperience } from '@/components/how-to-play/how-to-play-experience';
import { createDocumentationMetadata, serializeStructuredData } from '@/content/docs/metadata';
import { GAME_NAME } from '@/content/game/brand';

export const metadata: Metadata = createDocumentationMetadata({
  title: 'How to Play',
  description: `Interactive introduction to ${GAME_NAME}: animals, materials, COPPER, $FABLE access, Cat Dice, Cat Battle, and tournaments.`,
  route: '/how-to-play',
});

export default function HowToPlayPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to Play ${GAME_NAME}`,
    description: `Learn ${GAME_NAME} systems from first entry through optional Cat Battle and tournaments.`,
    step: [
      { '@type': 'HowToStep', name: 'Connect wallet and meet $FABLE access' },
      { '@type': 'HowToStep', name: 'Care for animals and collect materials' },
      { '@type': 'HowToStep', name: 'Use COPPER economy systems' },
      { '@type': 'HowToStep', name: 'Optional cat activities and tournaments' },
    ],
  };

  return (
    <>
      <HowToPlayExperience />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeStructuredData(schema) }}
      />
    </>
  );
}
