# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

Android-first. A React Native app (iOS and Android projects in this repo) that ships one brand design language on both; iOS gets the same design, not HIG-specific styling.

## Users

Home and shop owners in India who have a Diodetronix intrusion alarm panel installed at their premises. They open the app to arm or disarm the panel (Stay / Away), check whether the system is connected and healthy, review alarm and fault events, and manage who the panel calls or texts when an alarm goes off. Many use Hindi or Tamil, and their comfort with technology varies.

## Product Purpose

DTX Secure is the companion app for Diodetronix (DTX) alarm panels. It puts the panel's status, controls and configuration on the owner's phone, so they can see the system's state and change it without standing at the keypad. It works when the owner can trust at a glance that the premises are protected, and when changing the panel is safe and unambiguous.

## Positioning

The app is built for one piece of hardware: it controls a DTX panel directly over the network, uses the panel's own modes and settings, and is not a general smart-home hub.

## Operating Context

- Onboarding: create an account (email verification), then claim a panel by scanning the QR code on the device or entering its Device ID and claim code. One account can claim several panels and switch between them.
- Live connection to the panel over MQTT (AWS IoT). Connection states (connecting, connected, reconnecting, disconnected) and "last sync" times are part of the everyday experience.
- Main areas: Main (system status, Stay/Away mode, quick actions, latest activity), Zone (per-zone type, delays, Smart Check, location), Dialer (up to a fixed number of +91 mobile numbers with SMS/Call and Burglar/Fire alert types), Events (filterable alarm, power, battery and hooter history), Settings (panel configuration), Profile (account, theme, language, devices, help).
- Panel settings can only be changed while the panel is in Stay mode.
- Support comes from the Diodetronix team by email and phone, Monday to Saturday, 9:00 AM to 6:00 PM IST.

## Capabilities and Constraints

- Works only with Diodetronix panels.
- Localised in English, Hindi and Tamil (i18next); every string goes through the locale files.
- Light and dark themes, plus a System option; every colour token exists in both.
- Phone validation assumes 10-digit Indian mobile numbers without +91.
- Panel-configuration terms (Part Setting, Silence, Repeat, Auto ARM, Relay, Hooter Notify, Record & Play, Special Notify, Bank Details) follow the panel's own feature set.

## Brand Commitments

- Product name: **DTX Secure**. Company: **Diodetronix**.
- The brand navy `#000055` and the existing logo (`src/assets/images/logo*.png`) are binding.

## Evidence on Hand

- Logo and mode/status illustrations in `src/assets/images/`.
- Real UI copy in `src/i18n/locales/{en,hi,ta}.json`.
- No testimonials, customer counts, certifications or performance claims exist; do not invent any.

## Product Principles

1. **Status before everything.** The owner should know within a second whether the premises are armed and whether the app can actually reach the panel.
2. **Changes to the panel are deliberate.** Arming, disarming, saving configuration and deleting numbers must be clearly confirmed and their result reported; never leave the user guessing whether a command took.
3. **Plain language in three languages.** Write for a Hindi or Tamil speaker with modest tech comfort: short labels, no jargon the panel itself doesn't use, and layouts that survive longer translated strings.
4. **Honest about connection.** When the panel is offline or reconnecting, say so and show stale data as stale.

## Accessibility & Inclusion

- Users range in literacy and tech comfort and read English, Hindi or Tamil. Layouts must fit longer Devanagari and Tamil strings, and the user's chosen font size must not break them.
- Light and dark themes must both keep legible contrast.
