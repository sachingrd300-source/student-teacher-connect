import {ai} from '@/ai/genkit';
import { NextResponse } from 'next/server';

export const GET = ai.getApiHandler();
export const POST = ai.getApiHandler();
