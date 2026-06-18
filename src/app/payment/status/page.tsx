import { Suspense } from 'react';
import PaymentStatusPage from '../../../components/PaymentStatus';

export default function page() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
        </div>
      }
    >
      <PaymentStatusPage />
    </Suspense>
  );
}
