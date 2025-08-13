import React, { useEffect } from "react";

const ChangePageTitle = ({ customPageTitle }) => {
    useEffect(() => {
        const prev = document.title;
        document.title = customPageTitle;

        return () => {
            document.title = prev;
        }
    });

    return <></>;
};

export default ChangePageTitle;