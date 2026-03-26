// ─── Org ──────────────────────────────────────────────────────────────────────
export async function getOrganization(prisma, orgId) {
    return prisma.organization.findUnique({
        where: { id: orgId },
        select: {
            id: true, name: true, industry: true,
            businessType: true, teamSize: true,
            primaryUses: true, isOnboarded: true,
            createdAt: true, updatedAt: true,
            _count: { select: { members: true, projects: true } },
        },
    });
}
export async function updateOrganization(prisma, orgId, data) {
    return prisma.organization.update({
        where: { id: orgId },
        data,
        select: {
            id: true, name: true, industry: true,
            businessType: true, teamSize: true,
            primaryUses: true, createdAt: true, updatedAt: true,
        },
    });
}
export async function getOrgMembers(prisma, orgId) {
    return prisma.organizationMember.findMany({
        where: { organizationId: orgId },
        include: {
            user: {
                select: {
                    id: true, email: true, firstName: true,
                    lastName: true, role: true, isActive: true,
                    lastLogin: true, createdAt: true,
                },
            },
        },
        orderBy: { user: { createdAt: "asc" } },
    });
}
export async function getUser(prisma, firebaseId, orgId) {
    return prisma.organizationMember.findFirst({
        where: {
            user: {
                firebaseId: firebaseId,
            },
            organizationId: orgId,
        },
        select: {
            user: true,
            organizationId: true,
            organization: true,
            userId: true,
            id: true,
            role: true,
        }
    });
}
export async function updateUser(prisma, userId, data) {
    return prisma.user.update({
        where: { id: userId },
        data,
        select: {
            id: true, email: true, firstName: true,
            lastName: true, role: true, updatedAt: true,
        },
    });
}
