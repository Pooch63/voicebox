'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/db';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    yearOfStroke: '',
    otherInfo: '',
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        // Check if user already has data
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (userData && userData.name) {
          // User already onboarded, redirect to home
          router.push('/');
        } else if (userData) {
          // User exists but incomplete, prefill form
          setFormData({
            name: userData.name || '',
            age: userData.age?.toString() || '',
            gender: userData.gender || '',
            yearOfStroke: userData.year_of_stroke?.toString() || '',
            otherInfo: typeof userData.other_info === 'object' 
              ? JSON.stringify(userData.other_info, null, 2) 
              : '',
          });
        }
      } else {
        router.push('/auth/login');
      }
    };

    getUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!userId) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      let otherInfoJson = {};
      if (formData.otherInfo.trim()) {
        try {
          otherInfoJson = JSON.parse(formData.otherInfo);
        } catch {
          // If not valid JSON, store as a single field
          otherInfoJson = { notes: formData.otherInfo };
        }
      }

      const userData = {
        user_id: userId,
        name: formData.name || null,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender || null,
        year_of_stroke: formData.yearOfStroke ? parseInt(formData.yearOfStroke) : null,
        other_info: otherInfoJson,
        updated_at: new Date().toISOString(),
      };

      // Try to insert, if user exists, update instead
      const { error: upsertError } = await supabase
        .from('users')
        .upsert(userData, { onConflict: 'user_id' });

      if (upsertError) throw upsertError;

      // Redirect to home page
      router.push('/');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred while saving your information');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Welcome to VoiceBack
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Tell us a bit about yourself to get started
          </p>
        </div>
        
        <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  min="0"
                  max="150"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Your age"
                />
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="yearOfStroke" className="block text-sm font-medium text-gray-700 mb-1">
                Year of Stroke
              </label>
              <input
                id="yearOfStroke"
                name="yearOfStroke"
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                value={formData.yearOfStroke}
                onChange={(e) => setFormData({ ...formData, yearOfStroke: e.target.value })}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="e.g., 2020"
              />
            </div>

            <div>
              <label htmlFor="otherInfo" className="block text-sm font-medium text-gray-700 mb-1">
                Additional Information (Optional)
              </label>
              <textarea
                id="otherInfo"
                name="otherInfo"
                rows={4}
                value={formData.otherInfo}
                onChange={(e) => setFormData({ ...formData, otherInfo: e.target.value })}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Any other relevant information (e.g., specific needs, preferences, medical notes)"
              />
              <p className="mt-1 text-xs text-gray-500">
                You can enter free-form text or JSON format
              </p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Complete Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
