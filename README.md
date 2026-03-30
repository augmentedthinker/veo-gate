# veo-gate

A gated Gemini media-generation proof of concept.

## What it does

- asks for a 4-digit access code
- supports both image and video generation
- sends requests to backend routes
- backend calls Gemini using a server-side API key stored in Vercel env vars
- returns generated media to the browser

## Deployment model

This repo is designed for Vercel:
- `public/index.html` = frontend
- `api/image.js` = image generation
- `api/generate.js` = start Veo video generation
- `api/status.js` = poll Veo job status
- `api/video.js` = proxy Gemini video download through backend

## Required Vercel environment variables

- `GEMINI_API_KEY`
- `ACCESS_CODE`

## Current status

Initial gated media proof of concept created on 2026-03-30 and extended to support both image and video generation.
