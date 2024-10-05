import React from "react";
import Image from "next/image";

interface CardProps {
  title: string;
  description: string;
  imageUrl: string;
}

const Card: React.FC<CardProps> = ({ title, description, imageUrl }) => {
  return (
    <div className="relative overflow-hidden shadow-lg group">
      <Image
        src={imageUrl}
        alt={title}
        width={400}
        height={300}
        layout="responsive"
        className="transition-transform duration-300 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
      <div className="absolute inset-0 flex flex-col justify-end p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-200">{description}</p>
      </div>
    </div>
  );
};

interface CardsProps {
  cards: CardProps[];
}

const Cards: React.FC<CardsProps> = ({ cards }) => {
  return (
    <div className="">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-0">
        {cards.map((card, index) => (
          <Card key={index} {...card} />
        ))}
      </div>
    </div>
  );
};

export default Cards;
