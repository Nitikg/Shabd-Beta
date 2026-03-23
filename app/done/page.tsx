'use client';

import { KikiCharacter } from '@/components/KikiCharacter';

export default function DonePage() {
  return (
    <main className="kiki-gradient-bg min-h-screen px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 text-center">
        <div className="kiki-card w-full px-5 py-8">
          <KikiCharacter state="idle" className="mb-4" />
          <div className="font-[var(--font-baloo)] text-2xl text-kiki-indigo">
            Wah! Bahut shukriya!
          </div>
          <div className="mt-3 font-[var(--font-nunito)] text-base text-kiki-indigo/75 leading-relaxed">
            You and Kiki have had three wonderful sessions together.
            Kiki will be back soon with more stories!
          </div>
          <div className="mt-4 font-[var(--font-nunito)] text-sm text-kiki-indigo/50">
            Ask your Mamma or Papa to check back with Kiki soon. ✨
          </div>
        </div>
      </div>
    </main>
  );
}
