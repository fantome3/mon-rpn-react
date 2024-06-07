const CheckoutSteps = (props: any) => {
  return (
    <div className='flex justify-center gap-3 checkout-steps text-sm pb-5'>
      <div className={props.step1 ? 'active w-full' : 'w-full'}>S'inscrire</div>
      <div className={props.step2 ? 'active w-full' : 'w-full'}>Origines</div>
      <div className={props.step3 ? 'active w-full' : 'w-full'}>
        Informations
      </div>
    </div>
  )
}

export default CheckoutSteps
