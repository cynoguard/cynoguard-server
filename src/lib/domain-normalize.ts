/**
 * Domain normalization and validation utilities.
 */

/**
 * Normalize a raw domain input. Handles URLs, ports, trailing dots, whitespace.
 * Throws on invalid domains.
 */
export function normalizeDomain(input: string): string {
    let host = input.trim().toLowerCase();

    // If input looks like a URL (contains scheme or path), extract hostname
    if (host.includes("://") || host.startsWith("//")) {
        try {
            const url = new URL(host.startsWith("//") ? `http:${host}` : host);
            host = url.hostname;
        } catch {
            throw new Error(`Invalid URL input: ${input}`);
        }
    } else if (host.includes("/")) {
        // Has path but no scheme — prepend scheme to parse
        try {
            const url = new URL(`http://${host}`);
            host = url.hostname;
        } catch {
            throw new Error(`Invalid domain input: ${input}`);
        }
    }

    // Remove port if present (e.g. example.com:443)
    host = host.replace(/:\d+$/, "");

    // Remove trailing dot (e.g. example.com.)
    if (host.endsWith(".")) {
        host = host.slice(0, -1);
    }

    // Reject empty
    if (!host) {
        throw new Error("Domain cannot be empty");
    }

    // Reject IP addresses (v4 and v6)
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
        throw new Error(`IP addresses are not allowed: ${host}`);
    }
    if (host.startsWith("[") || /^[0-9a-f:]+$/i.test(host)) {
        throw new Error(`IPv6 addresses are not allowed: ${host}`);
    }

    // Must contain at least one dot
    if (!host.includes(".")) {
        throw new Error(`Domain must contain at least one dot: ${host}`);
    }

    // Total length check
    if (host.length > 253) {
        throw new Error(`Domain too long (max 253 chars): ${host}`);
    }

    // Validate each label
    const labels = host.split(".");
    for (const label of labels) {
        if (label.length === 0) {
            throw new Error(`Empty label in domain: ${host}`);
        }
        if (label.length > 63) {
            throw new Error(`Label too long (max 63 chars): ${label}`);
        }
        if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(label)) {
            throw new Error(
                `Invalid label "${label}": only a-z, 0-9, - allowed; cannot start/end with -`
            );
        }
    }

    return host;
}

/**
 * Get the TLD (last label) of a normalized domain.
 * MVP: does not handle public suffixes like co.uk.
 */
export function getTld(domain: string): string {
    const parts = domain.split(".");
    return parts[parts.length - 1]!;
}

/**
 * Get the SLD (second-level domain / label before TLD) of a normalized domain.
 * MVP simplification: `a.b.com` → `b`
 */
export function getSld(domain: string): string {
    const parts = domain.split(".");
    if (parts.length < 2) return parts[0]!;
    return parts[parts.length - 2]!;
}
