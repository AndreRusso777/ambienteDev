export default function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="min-h-24 flex items-center justify-center px-4 md:px-6 border-t border-x">
          <small className="text-sm leading-none text-slate-600">&copy; Dr Gorila - CNPJ: 56.443.251/0001-03 {new Date().toLocaleDateString('pt-BR', { year: "numeric" })}. Todos os direitos reservados.</small>
        </div>
      </div>
    </footer>
  );
}
