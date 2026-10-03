-- 067: tell NFC taps and QR scans apart, without rewriting history.
--
-- Until now the chip and the printed QR held the same URL (/api/nfc/CODE),
-- and every visit through it was recorded as source = 'nfc' — including
-- QR scans. From now on new chips carry ?src=nfc and new printed QRs carry
-- ?src=qr. Cards already out there carry neither, so a visit through them
-- is recorded as 'card': "a physical card, channel unknown".
--
-- Existing 'nfc' rows came through that same shared URL, so they are
-- relabelled 'card' too. Nothing is guessed: 'nfc' and 'qr' only ever mean
-- what they say from here on.
--
-- Safe to run more than once.

ALTER TABLE public.card_taps DROP CONSTRAINT IF EXISTS card_taps_source_check;
ALTER TABLE public.card_taps
  ADD CONSTRAINT card_taps_source_check CHECK (source IN ('nfc', 'qr', 'link', 'card'));

ALTER TABLE public.review_feedback DROP CONSTRAINT IF EXISTS review_feedback_source_check;
ALTER TABLE public.review_feedback
  ADD CONSTRAINT review_feedback_source_check CHECK (source IN ('nfc', 'qr', 'link', 'card'));

UPDATE public.card_taps SET source = 'card' WHERE source = 'nfc';
UPDATE public.review_feedback SET source = 'card' WHERE source = 'nfc';
