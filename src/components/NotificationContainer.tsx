interface NotificationContainerProps {
  notifications: string[];
}

const NotificationContainer = ({ notifications }: NotificationContainerProps) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification, index) => (
        <div
          key={index}
          className="bg-blue-800 text-white px-4 py-2 rounded shadow-lg animate-pulse"
        >
          {notification}
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;