-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  subscription_plan TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create websites table
CREATE TABLE public.websites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  template_name TEXT NOT NULL,
  slug TEXT UNIQUE,
  content_json JSONB DEFAULT '{}'::jsonb NOT NULL,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create assets table
CREATE TABLE public.assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create nfc_cards table
CREATE TABLE public.nfc_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  website_id UUID REFERENCES public.websites(id) ON DELETE SET NULL,
  card_url TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- WEBSITES
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own websites." ON public.websites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own websites." ON public.websites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own websites." ON public.websites FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own websites." ON public.websites FOR DELETE USING (auth.uid() = user_id);
-- Allow public viewing of published websites
CREATE POLICY "Public can view published websites." ON public.websites FOR SELECT USING (published = true);

-- ASSETS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own assets." ON public.assets FOR ALL USING (auth.uid() = user_id);

-- NFC CARDS
ALTER TABLE public.nfc_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own NFC cards." ON public.nfc_cards FOR ALL USING (auth.uid() = user_id);

-- Trigger for creating a profile automatically when a user signs up via auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
