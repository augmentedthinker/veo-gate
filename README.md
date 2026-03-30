# veo-gate

A gated Gemini Veo video-generation proof of concept.

## What it does

- asks for a 4-digit access code
- accepts a short video prompt
- sends the request to a backend route
- backend calls Gemini / Veo using a server-side API key
- polls until the video generation is done
- returns and displays the generated video

## Deployment model

This repo is designed for Vercel:
- `index.html` = frontend
- `api/generate.js` = start Veo job
- `api/status.js` = poll Veo job status

## Required Vercel environment variables

- `GEMINI_API_KEY`
- `ACCESS_CODE`

## Current status

Initial proof-of-concept scaffold created on 2026-03-30.
