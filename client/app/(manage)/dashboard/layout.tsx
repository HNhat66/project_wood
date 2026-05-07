import '../../globals.css';

import type { Metadata } from 'next';
import {
  Inter,
  Playfair_Display,
} from 'next/font/google';
import { cookies } from 'next/headers';
import { Toaster } from 'sonner';

import { MainLayout } from '@/components/layout/main-layout';
import { AuthProvider } from '@/lib/auth-context';
import { QueryProvider } from '@/providers/query-provider';

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
	display: "swap"
});

const playfair = Playfair_Display({
	subsets: ["latin"],
	variable: "--font-playfair",
	display: "swap"
});

export const metadata: Metadata = {
	title: {
		default: "Đồ Gỗ Store - Hệ thống quản lý cửa hàng",
		template: "%s | Đồ Gỗ Store"
	},
	description: "Hệ thống quản lý cửa hàng đồ gỗ hiện đại, chuyên nghiệp",
	keywords: ["đồ gỗ", "furniture", "wood", "quản lý", "cửa hàng"],
	authors: [{ name: "Đồ Gỗ Store Team" }],
	creator: "Đồ Gỗ Store",
	publisher: "Đồ Gỗ Store",
	robots: {
		index: false, // Internal management system
		follow: false,
	},
};

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const tokens = await cookies()
	const accessToken = tokens.get('access_token')?.value
	const refreshToken = tokens.get('refresh_token')?.value

	return (
		<html lang="vi" suppressHydrationWarning>
			<body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
				<AuthProvider accessToken={accessToken} refreshToken={refreshToken}>
					<QueryProvider>
						<MainLayout>
							{children}
						</MainLayout>
						<Toaster position='top-left' richColors />
					</QueryProvider>
				</AuthProvider>
			</body>
		</html>
	);
}
