import { useEffect, useState, useRef } from 'react';
import Cookies from 'js-cookie';

export default function CookieTest() {
  const [cookieValue, setCookieValue] = useState('Loading...');
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const testCookies = () => {
      console.group('Cookie Test Results');
      try {
        // Set test cookie
        Cookies.set('testCookie', 'testValue');
        
        // Gather all cookie data
        const cookieData = {
          documentCookie: document.cookie,
          jsCookieGet: Cookies.get(),
          specificCookie: Cookies.get('testCookie')
        };
        
        console.log('Cookie Test Status: Success');
        console.table(cookieData);
        setCookieValue(document.cookie || 'No cookies found');
      } catch (error) {
        console.error('Cookie Test Status: Failed');
        console.error('Error:', error);
        setCookieValue('Error reading cookies');
      }
      console.groupEnd();
    };

    testCookies();

    return () => {
      // Cleanup test cookie on unmount
      Cookies.remove('testCookie');
    };
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Cookie Test Component</h2>
      <p>Check the console for cookie logs.</p>
      <p className="text-sm text-gray-600 mt-2">Current cookies: {cookieValue}</p>
    </div>
  );
}
