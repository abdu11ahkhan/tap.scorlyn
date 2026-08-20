-- =====================================================================
-- Phase 8.5 — the one genuine (if low-severity) drift this reconciliation
-- found, via direct pg_default_acl introspection against production.
--
-- Supabase applies its own platform-level ALTER DEFAULT PRIVILEGES for
-- every new project: any function created by the `postgres` role
-- automatically gets EXECUTE granted directly to anon, authenticated, and
-- service_role — not through the PUBLIC pseudo-role. This isn't in any
-- migration in this repo; it's Supabase's own project bootstrapping,
-- confirmed by querying pg_default_acl on the live database (defaclrole
-- = postgres, defaclobjtype = 'f', granting X to postgres/anon/
-- authenticated/service_role on every schema-public function).
--
-- The practical effect: is_admin(), delete_own_account(), and
-- next_invoice_number() each shipped with "REVOKE ALL ... FROM PUBLIC"
-- before their intended "GRANT TO authenticated" — but REVOKE ... FROM
-- PUBLIC only removes the catch-all PUBLIC privilege. It does nothing to
-- a privilege already granted directly to anon by the default-ACL
-- mechanism at creation time. Confirmed live: anon can currently execute
-- all three. Not exploitable today — every one of them independently
-- guards against anonymous/non-owner misuse in its own body (is_admin()
-- returns false for a null auth.uid(); delete_own_account() raises if
-- auth.uid() is null; next_invoice_number() only skews a sequence, never
-- exposes the admin-only invoices table it feeds) — but it's a real gap
-- between stated intent and live grants, worth closing explicitly rather
-- than left relying on each function's body to compensate.
--
-- resolve_nfc_card() has the same root cause in the other direction: its
-- migration (045) never issued "REVOKE ALL ... FROM PUBLIC" before
-- granting anon/authenticated, so it also still carries the default
-- PUBLIC-level EXECUTE grant alongside the intended one. Its intended
-- audience already IS anon+authenticated, so this isn't a security gap —
-- just an inconsistency with every other public-RPC function in this
-- schema, tidied here for the same reason.
-- =====================================================================

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.delete_own_account() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.next_invoice_number() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.resolve_nfc_card(TEXT) FROM PUBLIC;

-- Idempotent re-grants — GRANT is a no-op if the privilege already
-- exists, so this is safe to run alongside the REVOKEs above regardless
-- of prior state.
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_invoice_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_nfc_card(TEXT) TO anon, authenticated;
