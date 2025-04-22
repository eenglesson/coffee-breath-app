import ChatBotTextArea from './ChatBotTextArea';

export default function page() {
  return (
    <>
      <section className='relative h-full'>
        <div className='absolute bottom-0 w-full flex flex-col items-center justify-center'>
          <ChatBotTextArea />
        </div>
      </section>
    </>
  );
}
