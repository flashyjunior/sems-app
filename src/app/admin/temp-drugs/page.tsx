import TempDrugReview from '@/components/Admin/TempDrugReview';
import { verifyToken } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Temp Drug Review - Admin',
};

export default async function Page() {
  // Server-side check: attempt to read auth token from cookies and verify role
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get?.('authToken')?.value || null;

    if (!tokenCookie) {
      // No server-side token present; allow client to handle sign-in redirect
      return (
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Temp Drug Review</h1>
          <TempDrugReview />
        </div>
      );
    }

    const payload = verifyToken(tokenCookie);
    if (!payload) return redirect('/');

    const role = await prisma.role.findUnique({ where: { id: payload.roleId } });
    if (!role || role.name !== 'admin') return redirect('/');

    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Temp Drug Review</h1>
        <TempDrugReview />
      </div>
    );
  } catch (error) {
    // On any verification error, redirect to home
    return redirect('/');
  }
}
