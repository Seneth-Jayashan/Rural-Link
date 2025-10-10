import { useState } from "react";

export default function NotificationPopup({ onAllow, onDeny }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-lg">
        <h2 className="text-xl font-bold mb-2">Stay Updated!</h2>
        <p className="text-gray-600 mb-4">
          Allow notifications to get real-time updates on your orders and promotions.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onDeny}
            className="px-4 py-2 bg-gray-200 rounded-lg"
          >
            Not Now
          </button>
          <button
            onClick={onAllow}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg"
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}
