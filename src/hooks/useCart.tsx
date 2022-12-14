import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const stock = (await api.get<Stock>(`stock/${productId}`)).data;
      const productExistsInCart = cart.find(item => item.id === productId);
      const productAmount = productExistsInCart ? productExistsInCart.amount : 0;

      if (stock.amount < productAmount + 1) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productExistsInCart) {

        const updatedAmount = cart.map(item => item.id === productId ? { ...item, amount: productAmount + 1 } : item);
        setCart(updatedAmount);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedAmount));
      } else {
        const product = (await api.get<Product>(`products/${productId}`)).data;
        const updateCart = [...cart, { ...product, amount: 1 }]
        setCart(updateCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart));

      }


    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExistInCart = cart.find(item => item.id === productId);
      if (productExistInCart) {
        const removeProductFromCart = cart.filter(item => item.id !== productId);
        setCart(removeProductFromCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(removeProductFromCart));
      } else {
        throw Error();
      }


    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) {
        return;
      }

      const stock = (await api.get<Stock>(`stock/${productId}`)).data;

      if (stock.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      const productExistInCart = cart.find(item => item.id === productId);
      if (productExistInCart) {
        const updateCart = cart.map(item => item.id === productId ? { ...item, amount } : item);
        setCart(updateCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart));
      } else {
        throw Error();
      }


    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
