import React, { useState } from 'react';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Button } from './ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

// Load Stripe with publishable key
let stripePromise: Promise<Stripe | null>;
const getStripe = () => {
  if (!stripePromise) {
    // In production, this should come from environment variable
    stripePromise = loadStripe(
      process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 
      'pk_test_51QABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    );
  }
  return stripePromise;
};

interface StripePaymentFormProps {
  amount: number;
  currency?: string;
  bookingDetails?: {
    providerId: string;
    serviceId: string;
    date: string;
    time: string;
    note?: string;
  };
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

const PaymentForm: React.FC<StripePaymentFormProps & { stripe: Stripe | null }> = ({
  amount,
  currency = 'zar',
  bookingDetails,
  onSuccess,
  onError,
  onCancel,
  stripe,
}) => {
  const stripeHook = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripeHook || !elements) {
      setPaymentError('Stripe has not loaded properly. Please refresh the page.');
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // 1. Create payment intent on our backend
      const apiUrl = import.meta.env.VITE_API_URL ?? "https://bion-backend.onrender.com";
      const response = await fetch(`${apiUrl}/api/stripe/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // In production, add authentication token here
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          metadata: bookingDetails,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to create payment intent');
      }

      const { clientSecret } = data.data;

      // 2. Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, paymentIntent } = await stripeHook.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            // In production, collect this from user
            name: 'Customer Name',
            email: 'customer@example.com',
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Payment failed');
      }

      if (paymentIntent.status === 'succeeded') {
        setPaymentSuccess(true);
        if (onSuccess) {
          onSuccess(paymentIntent.id);
        }
        
        // In production, you would also create the booking here
        if (bookingDetails) {
          // Call your booking API to create the booking
        }
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentError(error.message || 'An unexpected error occurred');
      if (onError) {
        onError(error.message || 'Payment failed');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true,
  };

  if (paymentSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
        <p className="text-gray-600 mb-4">
          Your payment has been processed successfully. Your booking is now confirmed.
        </p>
        <Button onClick={() => window.location.reload()}>
          Make Another Booking
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Details
          </label>
          <div className="border rounded-lg p-3 bg-white">
            <CardElement options={cardElementOptions} />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Test card: 4242 4242 4242 4242 | Exp: Any future date | CVC: Any 3 digits
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Amount:</span>
            <span className="font-semibold">R{amount.toFixed(2)}</span>
          </div>
          <div className="text-xs text-gray-500">
            This is a test payment. No real money will be charged.
          </div>
        </div>
      </div>

      {paymentError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
          <XCircle className="h-5 w-5" />
          <span>{paymentError}</span>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={!stripeHook || isProcessing}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay R${amount.toFixed(2)}`
          )}
        </Button>
        
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

const StripePaymentForm: React.FC<StripePaymentFormProps> = (props) => {
  return (
    <Elements stripe={getStripe()}>
      <PaymentForm stripe={null} {...props} />
    </Elements>
  );
};

export default StripePaymentForm;