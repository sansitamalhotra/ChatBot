import { useFormik } from "formik";
import * as Yup from "yup";
import { Link as RouterLink } from "react-router-dom";
import { Link, Unstable_Grid2 as Grid } from "@mui/material";
import { useState } from "react";
import CustomInputField from "../../ui/CustomInputField";
import CustomButton from "../../ui/CustomButton";
import useAuth from "../../hooks/useAuth";

const RegisterForm = () => {

    const { register } = useAuth();
    const [serverErrors, setServerErrors] = useState({});

    // const initialValues = { firstname, lastname, email, password, comfirmPassword, phone, country, sector };

    // const validationSchema = Yup.object().shape({
    //     firstname: Yup.string().required("First Name is required"),
    //     lastname: Yup.string().required("Last Name is required"),
    //     email: Yup.string().email("Invalid email").required("Email is required"),
    //     password: Yup.string()
    //         .required("Password is required")
    //         .matches(
    //             /(?=(.*[0-9]))((?=.*[A-Za-z0-9])(?=.*[A-Z])(?=.*[a-z]))^.{8,}$/,
    //             "Password should have 1 lowercase letter, 1 uppercase letter, 1 number, and be at least 8 characters long"
    //         ),
    //     phone: Yup.string().required("User Phone Number is required"),
    //     country: Yup.string().required("Country Field is required"),
    //     sector: Yup.string().required("Sector Field is required"),
    // });

    // const onSubmit = async (values, { setStatus, setSubmitting }) => {

    //     try 
    //     {
    //         await register({ firstname: values.firstname, lastname: value.lastname, email: values.email, phone: values.phone, country: values.country, sector: values.sector, password: values.password, comfirmPassword: values.comfirmPassword })
    //     }
    //     catch (error)
    //     {
    //         console.log(error);
    //         setServerErrors(error);
    //         setStatus({ success: false });
    //         setSubmitting(false);
    //     }
    // };

    // const formik = useFormik({ initialValues, validationSchema, onSubmit });


    // const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting } = formik;


    // return (
    //     <form onSubmit={handleSubmit} noValidate>
    //          <Grid container spacing={2}>
                
               
    //         </Grid>
    //     </form>
    // );
};

export default RegisterForm;