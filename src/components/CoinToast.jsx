import "./CoinToast.css";

export default function CoinToast({ amount }) {
  if (amount === null) return null;
  return (
    <div className="coin-toast" role="status" key={amount}>
      You have earned {amount.toLocaleString()} coins!
    </div>
  );
}
