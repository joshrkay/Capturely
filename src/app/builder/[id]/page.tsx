'use client';
import { use } from 'react';
import { Builder } from '../../pages/builder';
export default function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
  return <Builder />;
}
