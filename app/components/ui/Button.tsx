import React from "react";
import Link from "next/link";

interface ButtonProps {
  variant: "primary" | "secondary" | "outline";
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant,
  href,
  onClick,
  children,
  className = "",
}) => {
  const baseStyles =
    "font-medium py-2 px-4 rounded transition-all duration-200 ease-in-out";
  const variantStyles = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50",
    secondary:
      "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50",
    outline:
      "bg-transparent text-blue-600 border border-blue-600 hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50",
  };

  const buttonClass = `${baseStyles} ${variantStyles[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={buttonClass}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={buttonClass}>
      {children}
    </button>
  );
};

export default Button;
