import { getGalleryStructure } from '@/app/lib/gallery';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const folder = searchParams.get('folder');
    const galleryData = getGalleryStructure(folder || undefined);
    return NextResponse.json(galleryData);
  } catch (error) {
    console.error('Error loading gallery:', error);
    return NextResponse.json([], { status: 500 });
  }
}
