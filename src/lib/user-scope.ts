/**
 * User Scope & Authorization Utilities
 * 
 * HQ User: No pharmacyId assigned (can see enterprise data across all pharmacies)
 * Pharmacy User: Has pharmacyId assigned (can only see their pharmacy's data)
 */

export interface UserScope {
  isHQUser: boolean;
  isPharmacyUser: boolean;
  pharmacyId: string | null;
  canViewPharmacy: (targetPharmacyId: string) => boolean;
  canViewAllPharmacies: () => boolean;
}

/**
 * Determine user's scope and access level
 * @param userPharmacyId - The user's assigned pharmacy ID (null for HQ users)
 * @returns UserScope object with access methods
 */
export function getUserScope(userPharmacyId: string | null | undefined): UserScope {
  const isHQUser = !userPharmacyId;
  const isPharmacyUser = !!userPharmacyId;

  return {
    isHQUser,
    isPharmacyUser,
    pharmacyId: userPharmacyId || null,

    /**
     * Check if user can view data for a specific pharmacy
     * HQ users can view any pharmacy, pharmacy users can only view their own
     */
    canViewPharmacy: (targetPharmacyId: string): boolean => {
      if (isHQUser) return true; // HQ can view any pharmacy
      return userPharmacyId === targetPharmacyId; // Pharmacy user can only view their own
    },

    /**
     * Check if user can view data across all pharmacies
     * Only HQ users can do this
     */
    canViewAllPharmacies: (): boolean => isHQUser,
  };
}

/**
 * Get pharmacy filter for database queries
 * Returns a Prisma where clause filter based on user scope
 * 
 * @param userPharmacyId - The user's assigned pharmacy ID
 * @returns Pharmacy filter object, or undefined if all pharmacies visible
 * 
 * Usage in Prisma:
 *   const filter = getPharmacyFilter(user.pharmacyId);
 *   const records = await prisma.dispensingEvent.findMany({
 *     where: {
 *       ...filter,
 *       createdAt: { gte: startDate }
 *     }
 *   });
 */
export function getPharmacyFilter(userPharmacyId: string | null | undefined): { pharmacyId?: string } | undefined {
  if (!userPharmacyId) {
    // HQ user - no pharmacy filter needed
    return undefined;
  }
  // Pharmacy user - filter by their pharmacy
  return { pharmacyId: userPharmacyId };
}

/**
 * Validate that user has access to requested pharmacy
 * Throws error if user doesn't have access
 * 
 * @param userPharmacyId - The user's assigned pharmacy ID
 * @param requestedPharmacyId - The pharmacy being requested
 * @throws Error if user doesn't have access
 */
export function validatePharmacyAccess(
  userPharmacyId: string | null | undefined,
  requestedPharmacyId: string | null | undefined
): void {
  const scope = getUserScope(userPharmacyId);

  // If requesting specific pharmacy and user is pharmacy-specific
  if (requestedPharmacyId && scope.isPharmacyUser) {
    if (!scope.canViewPharmacy(requestedPharmacyId)) {
      throw new Error(
        `Access denied: You can only view data for your assigned pharmacy`
      );
    }
  }
}
