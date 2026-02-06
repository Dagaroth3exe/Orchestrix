import bg1 from "../Assets/bg1.jpg";

const IntroPage = () => {
    return (
        <>
            <div
                className="min-h-screen w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${bg1.src})` }}
            ></div>
        </>
    );
};

export default IntroPage;