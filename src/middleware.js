import { NextResponse } from 'next/server';

const ADMIN_PATH_PREFIX = '/admin';

const parseBasicAuth = (header) => {
    if (!header || typeof header !== 'string') return null;
    if (!header.startsWith('Basic ')) return null;
    try {
        const encoded = header.replace('Basic ', '');
        const decoded = typeof atob === 'function'
            ? atob(encoded)
            : Buffer.from(encoded, 'base64').toString(); // Fallback for Node environments
        const delimiterIndex = decoded.indexOf(':');
        if (delimiterIndex === -1) return null;
        const username = decoded.slice(0, delimiterIndex);
        const password = decoded.slice(delimiterIndex + 1);
        return { username, password };
    } catch {
        return null;
    }
};

export function middleware(req) {
    const url = req.nextUrl;
    if (!url.pathname.startsWith(ADMIN_PATH_PREFIX)) {
        return NextResponse.next();
    }

    const expectedUser = process.env.ADMIN_BASIC_USER;
    const expectedPass = process.env.ADMIN_BASIC_PASS;

    if (!expectedUser || !expectedPass) {
        console.error('Admin basic auth is enabled but ADMIN_BASIC_USER or ADMIN_BASIC_PASS is missing.');
        return new NextResponse('Admin authentication not configured.', { status: 500 });
    }

    const authHeader = req.headers.get('authorization');
    const credentials = parseBasicAuth(authHeader);

    if (!credentials || credentials.username !== expectedUser || credentials.password !== expectedPass) {
        const response = new NextResponse('Authentication required.', { status: 401 });
        response.headers.set('WWW-Authenticate', 'Basic realm="Admin Area"');
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*']
};
