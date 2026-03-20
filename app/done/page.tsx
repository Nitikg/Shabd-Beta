'use client';

import { MithuCharacter } from '@/components/MithuCharacter';

export default function DonePage() {
  return (
    <main className="mithu-gradient-bg min-h-screen px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
        <div className="mithu-card w-full px-5 py-8">
          <MithuCharacter state="idle" className="mb-4" />
          <div className="font-[var(--font-baloo)] text-2xl text-mithu-indigo">
            Wah! Bahut shukriya!
          </div>
          <div className="mt-3 font-[var(--font-nunito)] text-base text-mithu-indigo/75 leading-relaxed">
            You and Mithu have had three wonderful sessions together.
            Mithu will be back soon with more stories!
          </div>
          <div className="mt-4 font-[var(--font-nunito)] text-sm text-mithu-indigo/50">
            Ask your Mamma or Papa to check back with Mithu soon. 🦜
          </div>
        </div>
      </div>
    </main>
  );
}
