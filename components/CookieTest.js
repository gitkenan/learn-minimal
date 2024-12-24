import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

export default function CookieTest() {
  const [cookieValue, setCookieValue] = useState('Loading...');

  useEffect(() => {
    // Try to set a test cookie
    try {
      Cookies.set('testCookie', 'testValue');
      console.log('Test cookie set attempt completed');
      console.log('All cookies:', document.cookie);
      console.log('Direct cookie read:', Cookies.get('testCookie'));
    } catch (error) {
      console.error('Error setting cookie:', error);
    }

    // Try to read cookies in different ways
    try {
      const cookieData = {
        documentCookie: document.cookie,
        jsCookieGet: Cookies.get(),
        specificCookie: Cookies.get('testCookie')
      };
      console.log('Cookie API check:', cookieData);
      setCookieValue(document.cookie || 'No cookies found');
    } catch (error) {
      console.error('Error reading cookies:', error);
      setCookieValue('Error reading cookies');
    }
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Cookie Test Component</h2>
      <p>Check the console for cookie logs.</p>
      <p className="text-sm text-gray-600 mt-2">Current cookies: {cookieValue}</p>
    </div>
  );
}
