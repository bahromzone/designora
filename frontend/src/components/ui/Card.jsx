/**
 * Umumiy kartochka konteyneri (dizayn tizimidagi .card uslubi).
 */
function Card({ as: Tag = "div", className = "", children, ...rest }) {
  return (
    <Tag className={`card rounded-2xl p-5 ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

export default Card;
