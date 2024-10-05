type SpacerProps = {
  size: 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
};

const Spacer = ({ size }: SpacerProps) => {
  return (
    <div style={{ marginTop: `${size}rem`, marginBottom: `${size}rem` }}></div>
  );
};

export default Spacer;
