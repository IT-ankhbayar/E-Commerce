import React from 'react';
import './Item.css';
import { Link } from 'react-router-dom';

const Item = (props) => {
  const firstImage = props.images && props.images.length > 0 ? props.images[0] : ''; // Get the first image
  console.log(firstImage);
  // console.log("Item Props:", props); // Check the entire props object
  // console.log("Item ID:", props.id); // Check if id is correctly passed
  return (
    <div className='item'>
       <Link to={props.id ? `/product/${props.id}` : '#'}> 
    <img 
        onClick={() => window.scrollTo(0, 0)} 
        src={firstImage || "default-image-url.jpg"}  // Add fallback for the image
        alt={props.name || "Product"} 
    />
</Link>
        <p>{props.name}</p>
        <div className='item-prices'>
            <div className='item-price-new'>
                ${props.new_price}
            </div>
            <div className='item-price-old'>
                ${props.old_price}
            </div>   
        </div>
    </div>
  );
};

export default Item;
